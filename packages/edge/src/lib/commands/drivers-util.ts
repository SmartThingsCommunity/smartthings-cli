import {
	Device,
	DeviceIntegrationType,
	DriverChannelDetails,
	EdgeDriver,
	EdgeDriverSummary,
	InstalledDriver,
	LanDeviceDetails,
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

// TODO: when moving to yargs, delete in favor of chooseHub in hubs-choose module rather than converting this
// (May need to update other chooseHub if this one has functionality it doesn't that is used.)
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

export const edgeDeviceTypes = [
	DeviceIntegrationType.LAN,
	DeviceIntegrationType.MATTER,
	DeviceIntegrationType.ZIGBEE,
	DeviceIntegrationType.ZWAVE,
]

export type DeviceDriverInfo = {
	label?: string
	type: DeviceIntegrationType
	deviceId: string
	driverId?: string
	hubId?: string
	hubLabel?: string
}

type DeviceTypeInfo = Pick<LanDeviceDetails, 'driverId' | 'hubId'>

const deviceTypeInfo = (device: Device): DeviceTypeInfo => {
	if (device.type === DeviceIntegrationType.LAN && device.lan) {
		return device.lan
	}
	if (device.type === DeviceIntegrationType.MATTER && device.matter) {
		return device.matter
	}
	if (device.type === DeviceIntegrationType.ZIGBEE && device.zigbee) {
		return device.zigbee
	}
	if (device.type === DeviceIntegrationType.ZWAVE && device.zwave) {
		return device.zwave
	}
	throw Error(`unexpected device type ${device.type} or missing type info`)
}

const deviceToDeviceDriverInfo = (device: Device, hubDevices: Device[]): DeviceDriverInfo => {
	const typeInfo = deviceTypeInfo(device)
	const hubDevice = hubDevices.find(hub => typeInfo.hubId && hub.deviceId === typeInfo.hubId)
	return {
		type: device.type,
		label: device.label,
		deviceId: device.deviceId,
		driverId: typeInfo.driverId,
		hubId: typeInfo.hubId,
		hubLabel: hubDevice?.label,
	}
}

export const getDriverDevices = async (client: SmartThingsClient): Promise<DeviceDriverInfo[]> => {
	const hubDevices = await client.devices.list({ type: DeviceIntegrationType.HUB })
	return (await client.devices.list({ type: edgeDeviceTypes }))
		.map(device => deviceToDeviceDriverInfo(device, hubDevices))
}
