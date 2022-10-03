import { Device, DeviceHealth, DeviceStatus } from '@smartthings/core-sdk'

import { summarizedText, TableGenerator } from '@smartthings/cli-lib'


export type DeviceWithLocation = Device & { location?: string }

export const prettyPrintAttribute = (value: unknown): string => {
	let result = JSON.stringify(value)
	if (result.length > 50) {
		result = JSON.stringify(value, null, 2)
	}
	return result
}

export const buildStatusTableOutput = (tableGenerator: TableGenerator, data: DeviceStatus): string => {
	let output = ''
	if (data.components) {
		const componentIds = Object.keys(data.components)
		for (const componentId of componentIds) {
			const table = tableGenerator.newOutputTable({ head: ['Capability', 'Attribute', 'Value'] })
			if (componentIds.length > 1) {
				output += `\n${componentId} component\n`
			}
			const component = data.components[componentId]
			for (const capabilityName of Object.keys(component)) {
				const capability = component[capabilityName]
				for (const attributeName of Object.keys(capability)) {
					const attribute = capability[attributeName]
					table.push([
						capabilityName,
						attributeName,
						attribute.value !== null ?
							`${prettyPrintAttribute(attribute.value)}${attribute.unit ? ' ' + attribute.unit : ''}` : ''])
				}
			}
			output += table.toString()
			output += '\n'
		}
	}
	return output
}

export const buildEmbeddedStatusTableOutput = (tableGenerator: TableGenerator, data: Device): string => {
	let output = ''
	let hasStatus = false
	if (data.components) {
		for (const component of data.components) {
			const table = tableGenerator.newOutputTable({ head: ['Capability', 'Attribute', 'Value'] })
			if (data.components.length > 1) {
				output += `\n${component.id} component\n`
			}

			for (const capability of component.capabilities) {
				if (capability.status) {
					hasStatus = true
					for (const attributeName of Object.keys(capability.status)) {
						const attribute = capability.status[attributeName]
						table.push([
							capability.id,
							attributeName,
							attribute.value !== null ?
								`${prettyPrintAttribute(attribute.value)}${attribute.unit ? ' ' + attribute.unit : ''}` : ''])
					}
				}
			}
			output += table.toString()
			output += '\n'
		}
	}
	return hasStatus ? output : ''
}

export const buildTableOutput = (tableGenerator: TableGenerator, device: Device & { profileId?: string; healthState?: DeviceHealth }): string => {
	const table = tableGenerator.newOutputTable()
	table.push(['Label', device.label])
	table.push(['Name', device.name])
	table.push(['Id', device.deviceId])
	table.push(['Type', device.type])
	table.push(['Manufacturer Code', device.deviceManufacturerCode ?? ''])
	table.push(['Location Id', device.locationId ?? ''])
	table.push(['Room Id', device.roomId ?? ''])
	table.push(['Profile Id', device.profile?.id ?? (device.profileId ?? '')])
	for (const comp of device.components ?? []) {
		const label = comp.id === 'main' ? 'Capabilities' : `Capabilities (${comp.id})`
		table.push([label,  comp.capabilities.map(capability => capability.id).join('\n')])
	}
	if (device.childDevices) {
		table.push(['Child Devices',  device.childDevices?.map(child => child.id).join('\n') ?? ''])
	}
	if (device.healthState) {
		table.push(['Device Health', device.healthState.state])
		table.push(['Last Updated', device.healthState.lastUpdatedDate])
	}

	const mainInfo = table.toString()

	const statusInfo = buildEmbeddedStatusTableOutput(tableGenerator, device)

	let deviceIntegrationInfo = 'None'
	let infoFrom
	if ('app' in device) {
		infoFrom = 'app'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.app ?? {},
			['installedAppId', 'externalId', { prop: 'profile.id', label: 'Profile Id' }])
	} else if ('ble' in device) {
		infoFrom = 'ble'
		deviceIntegrationInfo = 'No Device Integration Info for BLE devices'
	} else if ('bleD2D' in device) {
		infoFrom = 'bleD2D'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.bleD2D ?? {},
			['advertisingId', 'identifier', 'configurationVersion', 'configurationUrl'])
	} else if ('dth' in device) {
		infoFrom = 'dth'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.dth ?? {},
			['deviceTypeId', 'deviceTypeName', 'completedSetup', 'deviceNetworkType',
				'executingLocally', 'hubId', 'installedGroovyAppId', 'networkSecurityLevel'])
	} else if ('lan' in device) {
		infoFrom = 'lan'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.lan ?? {},
			['networkId', 'driverId', 'executingLocally', 'hubId', 'provisioningState'])
	} else if ('zigbee' in device) {
		infoFrom = 'zigbee'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.zigbee ?? {},
			['eui', 'networkId', 'driverId', 'executingLocally', 'hubId', 'provisioningState'])
	} else if ('zwave' in device) {
		infoFrom = 'zwave'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.zwave ?? {},
			['networkId', 'driverId', 'executingLocally', 'hubId', 'networkSecurityLevel', 'provisioningState'])
	} else if ('ir' in device) {
		infoFrom = 'ir'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.ir ?? {},
			['parentDeviceId', 'profileId', 'ocfDeviceType', 'irCode'])
	} else if ('irOcf' in device) {
		infoFrom = 'irOcf'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.irOcf ?? {},
			['parentDeviceId', 'profileId', 'ocfDeviceType', 'irCode'])
	} else if ('ocf' in device) {
		infoFrom = 'ocf'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.ocf ?? {},
			['deviceId', 'ocfDeviceType', 'name', 'specVersion', 'verticalDomainSpecVersion',
				'manufacturerName', 'modelNumber', 'platformVersion', 'platformOS', 'hwVersion',
				'firmwareVersion', 'vendorId', 'vendorResourceClientServerVersion', 'locale'])
	} else if ('viper' in device) {
		infoFrom = 'viper'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.viper ?? {},
			['uniqueIdentifier', 'manufacturerName', 'modelName', 'swVersion', 'hwVersion'])
	} else if ('virtual' in device) {
		infoFrom = 'virtual'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.virtual ?? {},
			['name', { prop: 'hubId', skipEmpty: true }, { prop: 'driverId', skipEmpty: true }])
	}

	return `Main Info\n${mainInfo}\n\n` +
		(statusInfo ? `Device Status\n${statusInfo}\n` : '') +
		(infoFrom ? `Device Integration Info (from ${infoFrom})\n${deviceIntegrationInfo}\n\n` : '') +
		summarizedText
}
