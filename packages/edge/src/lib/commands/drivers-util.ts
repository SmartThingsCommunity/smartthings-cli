import {
	Device,
	DeviceIntegrationType,
	DriverChannelDetails,
	EdgeDriver,
	EdgeDriverSummary,
	InstalledDriver,
	SmartThingsClient,
} from '@smartthings/core-sdk'

import {
	APICommand,
	ChooseOptions,
	chooseOptionsDefaults,
	chooseOptionsWithDefaults,
	forAllOrganizations,
	selectFromList,
	SelectFromListConfig,
	stringTranslateToId,
	TableFieldDefinition,
	TableGenerator,
} from '@smartthings/cli-lib'


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

export const listDrivers = async (client: SmartThingsClient, includeAllOrganizations?: boolean): Promise<EdgeDriver[]> =>
	includeAllOrganizations
		? forAllOrganizations(client, orgClient => orgClient.drivers.list())
		: client.drivers.list()

/**
 * Filter the driver currently in use by a device out of a list of drivers.
 */
export const withoutCurrentDriver = async (client: SmartThingsClient, deviceId: string, drivers: DriverChoice[]): Promise<DriverChoice[]> => {
	const device = await client.devices.get(deviceId)
	const currentDriverId = device.lan?.driverId ??
		device.matter?.driverId ??
		device.zigbee?.driverId ??
		device.zwave?.driverId

	return drivers.filter(driver => driver.driverId !== currentDriverId)
}

export const listAllAvailableDrivers = async (client: SmartThingsClient, deviceId: string, hubId: string): Promise<DriverChoice[]> => {
	const installedDrivers = await client.hubdevices.listInstalled(hubId)
	const defaultDrivers = (await client.drivers.listDefault())
		.filter(driver => !installedDrivers.find(installed => installed.driverId === driver.driverId))
	return withoutCurrentDriver(client, deviceId, [...installedDrivers, ...defaultDrivers ])
}

export const listMatchingDrivers = async (client: SmartThingsClient, deviceId: string, hubId: string): Promise<DriverChoice[]> =>
	withoutCurrentDriver(client, deviceId, await client.hubdevices.listInstalled(hubId, deviceId))

/**
 * When presenting a list of drivers to choose from, we only use the `driverId` and `name` fields.
 * Using this type instead of `EdgeDriverSummary` allows the caller of `chooseDriver` (below)
 * to use functions that return other objects as long as they include these two fields.
 */
export type DriverChoice = Pick<EdgeDriverSummary, 'driverId' | 'name'>

export async function chooseDriver(command: APICommand<typeof APICommand.flags>, promptMessage: string, commandLineDriverId?: string,
		options?: Partial<ChooseOptions<DriverChoice>>): Promise<string> {
	const opts = {
		...chooseOptionsDefaults(),
		listItems: (): Promise<DriverChoice[]> => command.client.drivers.list(),
		...options,
	}
	const config: SelectFromListConfig<DriverChoice> = {
		itemName: 'driver',
		primaryKeyName: 'driverId',
		sortKeyName: 'name',
	}
	const preselectedId = opts.allowIndex
		? await stringTranslateToId(config, commandLineDriverId, opts.listItems)
		: commandLineDriverId
	return selectFromList(command, config, { preselectedId, listItems: opts.listItems, promptMessage })
}

/**
 * List hubs owned by the user. Hubs in locations shared with the user are not included because edge
 * drivers cannot be managed on them.
 */
export const listHubs = async (command: APICommand<typeof APICommand.flags>): Promise<Device[]> => {
	const hubs = await command.client.devices.list({ type: DeviceIntegrationType.HUB })
	const locationIds = new Set<string>()
	hubs.forEach(hub => {
		if (hub.locationId !== undefined) {
			locationIds.add(hub.locationId)
		} else {
			command.logger.warn('hub record found without locationId', hub)
		}
	})

	// remove shared locations
	for (const locationId of locationIds) {
		const location = await command.client.locations.get(locationId, { allowed: true })

		if (!location.allowed?.includes('d:locations')) {
			command.logger.warn('filtering out location', location)
			locationIds.delete(location.locationId)
		}
	}

	return hubs.filter(hub => hub.locationId && locationIds.has(hub.locationId))
}

export const chooseHub = async (command: APICommand<typeof APICommand.flags>, promptMessage: string,
		commandLineHubId: string | undefined,
		options?: Partial<ChooseOptions<Device>>): Promise<string> => {
	const opts = chooseOptionsWithDefaults(options)

	const config: SelectFromListConfig<Device> = {
		itemName: 'hub',
		primaryKeyName: 'deviceId',
		sortKeyName: 'name',
		listTableFieldDefinitions: ['label', 'name', 'deviceId'],
	}

	const listItems = options?.listItems ?? (() => listHubs(command))

	const preselectedId = commandLineHubId
		? (opts.allowIndex
			? await stringTranslateToId(config, commandLineHubId, listItems)
			: commandLineHubId)
		: undefined

	const defaultValue = opts.useConfigDefault
		? {
			configKey: 'defaultHub',
			getItem: (id: string): Promise<Device> => command.client.devices.get(id),
			userMessage: (hub: Device): string => `using previously specified default hub labeled "${hub.label}" (${hub.deviceId})`,
		}
		: undefined
	return selectFromList(command, config, { preselectedId, listItems, promptMessage, defaultValue })
}

export type DriverChannelDetailsWithName = DriverChannelDetails & {
	name: string
}

export const listAssignedDriversWithNames = async (client: SmartThingsClient, channelId: string): Promise<DriverChannelDetailsWithName[]> => {
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

export const chooseDriverFromChannel = async (command: APICommand<typeof APICommand.flags>, channelId: string,
		preselectedId?: string): Promise<string> => {
	const config: SelectFromListConfig<DriverChannelDetailsWithName> = {
		itemName: 'driver',
		primaryKeyName: 'driverId',
		sortKeyName: 'name',
	}
	const listItems = (): Promise<DriverChannelDetailsWithName[]> => listAssignedDriversWithNames(command.client, channelId)
	return selectFromList(command, config,
		{ preselectedId, listItems, promptMessage: 'Select a driver to install.' })
}

export const chooseInstalledDriver = async (command: APICommand<typeof APICommand.flags>, hubId: string, promptMessage: string, commandLineDriverId?: string): Promise<string> => {
	const config: SelectFromListConfig<InstalledDriver> = {
		itemName: 'driver',
		primaryKeyName: 'driverId',
		sortKeyName: 'name',
	}

	const listItems = (): Promise<InstalledDriver[]> => command.client.hubdevices.listInstalled(hubId)
	const preselectedId = await stringTranslateToId(config, commandLineDriverId, listItems)
	return selectFromList(command, config, { preselectedId, listItems, promptMessage })
}
