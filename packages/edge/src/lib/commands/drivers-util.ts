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
