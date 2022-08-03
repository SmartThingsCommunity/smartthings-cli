import { Device } from '@smartthings/core-sdk'

import { summarizedText, TableGenerator } from '@smartthings/cli-lib'


export type DeviceWithLocation = Device & { location?: string }

export const buildTableOutput = (tableGenerator: TableGenerator, device: Device & { profileId?: string }): string => {
	const table = tableGenerator.newOutputTable()
	table.push(['Name', device.name])
	table.push(['Type', device.type])
	table.push(['Id', device.deviceId])
	table.push(['Label', device.label])
	table.push(['Manufacturer Code', device.deviceManufacturerCode ?? ''])
	table.push(['Location Id', device.locationId ?? ''])
	table.push(['Room Id', device.roomId ?? ''])
	for (const comp of device.components ?? []) {
		table.push([`${comp.id} component`,  comp.capabilities.map(capability => capability.id).join('\n')])
	}
	table.push(['Child Devices',  device.childDevices?.map(child => child.id).join('\n') ?? ''])
	table.push(['Profile Id', device.profile?.id ?? (device.profileId ?? '')])

	const mainInfo = table.toString()

	let deviceIntegrationInfo = 'None'
	let infoFrom
	if ('app' in device) {
		infoFrom = 'app'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.app,
			['installedAppId', 'externalId', { prop: 'profile.id', label: 'Profile Id' }])
	} else if ('ble' in device) {
		infoFrom = 'ble'
		deviceIntegrationInfo = 'No Device Integration Info for BLE devices'
	} else if ('bleD2D' in device) {
		infoFrom = 'bleD2D'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.bleD2D,
			['advertisingId', 'identifier', 'configurationVersion', 'configurationUrl'])
	} else if ('dth' in device) {
		infoFrom = 'dth'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.dth,
			['deviceTypeId', 'deviceTypeName', 'completedSetup', 'deviceNetworkType',
				'executingLocally', 'hubId', 'installedGroovyAppId', 'networkSecurityLevel'])
	} else if ('lan' in device) {
		infoFrom = 'lan'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.lan,
			['networkId', 'driverId', 'executingLocally', 'hubId', 'provisioningState'])
	} else if ('zigbee' in device) {
		infoFrom = 'zigbee'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.zigbee,
			['eui', 'networkId', 'driverId', 'executingLocally', 'hubId', 'provisioningState'])
	} else if ('zwave' in device) {
		infoFrom = 'zwave'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.zwave,
			['networkId', 'driverId', 'executingLocally', 'hubId', 'networkSecurityLevel', 'provisioningState'])
	} else if ('ir' in device) {
		infoFrom = 'ir'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.ir,
			['parentDeviceId', 'profileId', 'ocfDeviceType', 'irCode'])
	} else if ('irOcf' in device) {
		infoFrom = 'irOcf'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.irOcf,
			['parentDeviceId', 'profileId', 'ocfDeviceType', 'irCode'])
	} else if ('ocf' in device) {
		infoFrom = 'ocf'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.ocf,
			['deviceId', 'ocfDeviceType', 'name', 'specVersion', 'verticalDomainSpecVersion',
				'manufacturerName', 'modelNumber', 'platformVersion', 'platformOS', 'hwVersion',
				'firmwareVersion', 'vendorId', 'vendorResourceClientServerVersion', 'locale'])
	} else if ('viper' in device) {
		infoFrom = 'viper'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.viper,
			['uniqueIdentifier', 'manufacturerName', 'modelName', 'swVersion', 'hwVersion'])
	} else if ('virtual' in device) {
		infoFrom = 'virtual'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.virtual,
			['name', { prop: 'hubId', skipEmpty: true }, { prop: 'driverId', skipEmpty: true }])
	}

	return `Main Info\n${mainInfo}\n\n` +
		(infoFrom ? `Device Integration Info (from ${infoFrom})\n${deviceIntegrationInfo}\n\n` : '') +
		summarizedText
}
