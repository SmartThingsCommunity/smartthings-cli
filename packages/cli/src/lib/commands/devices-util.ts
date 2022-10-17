import { Device, DeviceHealth, DeviceStatus } from '@smartthings/core-sdk'

import { TableGenerator } from '@smartthings/cli-lib'


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
		let isFirst = true
		for (const component of data.components) {
			if (isFirst) {
				isFirst = false
			} else {
				output += '\n'
			}
			const table = tableGenerator.newOutputTable({ head: ['Capability', 'Attribute', 'Value'] })
			if (data.components.length > 1) {
				output += `${component.id} component\n`
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
	if (device.app) {
		infoFrom = 'app'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.app,
			['installedAppId', 'externalId', { path: 'profile.id', label: 'Profile Id' }])
	} else if (device.ble) {
		infoFrom = 'ble'
		deviceIntegrationInfo = 'No Device Integration Info for BLE devices'
	} else if (device.bleD2D) {
		infoFrom = 'bleD2D'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.bleD2D,
			['advertisingId', 'identifier', 'configurationVersion', 'configurationUrl'])
	} else if (device.dth) {
		infoFrom = 'dth'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.dth,
			['deviceTypeId', 'deviceTypeName', 'completedSetup', 'deviceNetworkType',
				'executingLocally', 'hubId', 'installedGroovyAppId', 'networkSecurityLevel'])
	} else if (device.lan) {
		infoFrom = 'lan'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.lan,
			['networkId', 'driverId', 'executingLocally', 'hubId', 'provisioningState'])
	} else if (device.zigbee) {
		infoFrom = 'zigbee'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.zigbee,
			['eui', 'networkId', 'driverId', 'executingLocally', 'hubId', 'provisioningState'])
	} else if (device.zwave) {
		infoFrom = 'zwave'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.zwave,
			['networkId', 'driverId', 'executingLocally', 'hubId', 'networkSecurityLevel', 'provisioningState'])
	} else if (device.ir) {
		infoFrom = 'ir'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.ir,
			['parentDeviceId', 'profileId', 'ocfDeviceType', 'irCode'])
	} else if (device.irOcf) {
		infoFrom = 'irOcf'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.irOcf,
			['parentDeviceId', 'profileId', 'ocfDeviceType', 'irCode'])
	} else if (device.ocf) {
		infoFrom = 'ocf'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.ocf,
			['deviceId', 'ocfDeviceType', 'name', 'specVersion', 'verticalDomainSpecVersion',
				'manufacturerName', 'modelNumber', 'platformVersion', 'platformOS', 'hwVersion',
				'firmwareVersion', 'vendorId', 'vendorResourceClientServerVersion', 'locale'])
	} else if (device.viper) {
		infoFrom = 'viper'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.viper,
			['uniqueIdentifier', 'manufacturerName', 'modelName', 'swVersion', 'hwVersion'])
	} else if (device.virtual) {
		infoFrom = 'virtual'
		deviceIntegrationInfo = tableGenerator.buildTableFromItem(device.virtual,
			['name', { prop: 'hubId', skipEmpty: true }, { prop: 'driverId', skipEmpty: true }])
	}

	return `Main Info\n${mainInfo}` +
		(statusInfo ? `\n\nDevice Status\n${statusInfo}` : '') +
		(infoFrom ? `\n\nDevice Integration Info (from ${infoFrom})\n${deviceIntegrationInfo}` : '')
}
