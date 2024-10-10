import {
	type EdgeDriver,
	type EdgeDriverSummary,
	type SmartThingsClient,
} from '@smartthings/core-sdk'

import { forAllOrganizations } from '../../../api-helpers.js'
import { type TableFieldDefinition, type TableGenerator } from '../../../table-generator.js'


export const listTableFieldDefinitions: TableFieldDefinition<EdgeDriverSummary>[] =
	['driverId', 'name', 'version', 'packageKey']

export const permissionsValue = (driver: EdgeDriver): string => driver.permissions?.map(permission => permission.name).join('\n') || 'none'

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
