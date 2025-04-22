import {
	type DriverChannelDetails,
	type EdgeDriver,
	type EdgeDriverSummary,
	type SmartThingsClient,
} from '@smartthings/core-sdk'

import { forAllOrganizations } from '../../api-helpers.js'
import { type TableFieldDefinition, type TableGenerator } from '../../table-generator.js'


export type DriverChannelDetailsWithName = DriverChannelDetails & {
	name: string
}

export const listTableFieldDefinitions: TableFieldDefinition<EdgeDriverSummary>[] =
	['driverId', 'name', 'version', 'packageKey']

export const permissionsValue = (driver: EdgeDriver): string =>
	driver.permissions?.map(permission => permission.name).join('\n') || 'none'

export const buildTableOutput = (tableGenerator: TableGenerator, driver: EdgeDriver): string => {
	const basicInfo = tableGenerator.buildTableFromItem(driver, [
		'driverId', 'name', 'version', 'packageKey', 'description',
		{ label: 'Permissions', value: permissionsValue },
	])

	const deviceIntegrationProfiles = 'Device Integration Profiles\n' +
		tableGenerator.buildTableFromList(driver.deviceIntegrationProfiles,
			['id', 'majorVersion'])
	let fingerprints = 'No fingerprints specified.'
	if (driver.fingerprints?.length) {
		fingerprints = 'Fingerprints\n' +
			tableGenerator.buildTableFromList(driver.fingerprints, ['id', 'type', 'deviceLabel'])
	}
	return `Basic Information\n${basicInfo}\n\n` +
		`${deviceIntegrationProfiles}\n\n` +
		fingerprints
}

export const listDrivers = async (
		client: SmartThingsClient,
		includeAllOrganizations?: boolean,
): Promise<EdgeDriver[]> =>
	includeAllOrganizations
		? forAllOrganizations(client, orgClient => orgClient.drivers.list())
		: client.drivers.list()

export const listAssignedDriversWithNames = async (
		client: SmartThingsClient,
		channelId: string,
): Promise<DriverChannelDetailsWithName[]> => {
	const drivers = await client.channels.listAssignedDrivers(channelId)
	return (await Promise.all(
		drivers.map(async driver => {
			try {
				const driverInfo = await client.channels.getDriverChannelMetaInfo(channelId, driver.driverId)
				return {
					...driver,
					name: driverInfo.name,
				}
			} catch (error) {
				// There is currently a bug in the API that causes `listAssignedDrivers`
				// to return drivers that were deleted but not removed from the channel.
				// We can tell they have been deleted because we get a 404 on the call
				// to `getRevision`, so we'll just skip them until the API is fixed.
				if (error.response?.status === 404) {
					return undefined
				}
				throw error
			}
		}))).filter((driver): driver is DriverChannelDetailsWithName => !!driver)
}
