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
