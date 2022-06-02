import inquirer from 'inquirer'
import {CapabilityAttribute, CapabilityReference, Component, Device} from '@smartthings/core-sdk'

import {
	APICommand,
	selectFromList,
	summarizedText,
	TableGenerator,
} from '@smartthings/cli-lib'


export type DeviceWithLocation = Device & { location?: string }

export interface CapabilityAttributeItem {
	attributeName: string
	attribute: CapabilityAttribute
}

export interface CapabilityUnitItem {
	unit: string
}

export interface CapabilityValueItem {
	value: string
}

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
	}

	return `Main Info\n${mainInfo}\n\n` +
		(infoFrom ? `Device Integration Info (from ${infoFrom})\n${deviceIntegrationInfo}\n\n` : '') +
		summarizedText
}

export const chooseComponent = async (command: APICommand<typeof APICommand.flags>, device: Device): Promise<Component> => {
	let component
	if (device.components) {

		const config = {
			itemName: 'component',
			primaryKeyName: 'id',
			sortKeyName: 'id',
			listTableFieldDefinitions: ['id'],
		}

		const listItems = async (): Promise<Component[]> => Promise.resolve(device.components || [])
		const preselectedId = device.components.length === 1 ? device.components[0].id : undefined
		const componentId = await selectFromList(command, config, { preselectedId, listItems })
		component = device.components.find(comp => comp.id == componentId)
	}

	if (!component) {
		throw new Error('Component not found')
	}

	return component
}

export const chooseCapability = async (command: APICommand<typeof APICommand.flags>, component: Component): Promise<CapabilityReference> => {
	const config = {
		itemName: 'capability',
		primaryKeyName: 'id',
		sortKeyName: 'id',
		listTableFieldDefinitions: ['id'],
	}

	const listItems = async (): Promise<CapabilityReference[]> => Promise.resolve(component.capabilities)
	const preselectedId = component.capabilities.length === 1 ? component.capabilities[0].id : undefined
	const capabilityId = await selectFromList(command, config, { preselectedId, listItems })
	const capability = component.capabilities.find(cap => cap.id === capabilityId)

	if (!capability) {
		throw new Error('Capability not found')
	}

	return capability
}

export const chooseAttribute = async (command: APICommand<typeof APICommand.flags>, cap: CapabilityReference): Promise<CapabilityAttributeItem> => {
	let attributeName
	let attribute
	const config = {
		itemName: 'attribute',
		primaryKeyName: 'attributeName',
		sortKeyName: 'attributeName',
		listTableFieldDefinitions: ['attributeName'],
	}

	const capability = await command.client.capabilities.get(cap.id, cap.version || 1)
	const attributes = capability.attributes
	if (attributes) {
		const attributeNames = Object.keys(attributes)
		const attributeList: CapabilityAttributeItem[] = attributeNames.map(attributeName => {
			return {attributeName, attribute: attributes[attributeName]}
		})
		const listItems = async (): Promise<CapabilityAttributeItem[]> => Promise.resolve(attributeList)
		const preselectedId = attributeNames.length === 1 ? attributeNames[0] : undefined
		attributeName = await selectFromList(command, config, {preselectedId, listItems})
		attribute = attributes[attributeName]
	}

	if (!attributeName || !attribute) {
		throw new Error(`Attribute ${attributeName} not found`)
	}
	return {attributeName, attribute}
}

export const chooseUnit = async (command: APICommand<typeof APICommand.flags>, attribute: CapabilityAttribute): Promise<string | undefined> => {
	let unit
	const units = attribute.schema.properties.unit?.enum
	if (units) {
		const config = {
			itemName: 'unit',
			primaryKeyName: 'unit',
			sortKeyName: 'unit',
			listTableFieldDefinitions: ['unit'],
		}

		const listItems = async (): Promise<CapabilityUnitItem[]> => Promise.resolve(units.map(unit => {
			return {unit}
		}))

		const preselectedId = units.length === 1 ? units[0] : undefined
		unit = await selectFromList(command, config, {preselectedId, listItems})
	}
	return unit
}

export const chooseValue = async (command: APICommand<typeof APICommand.flags>, attribute: CapabilityAttribute, name: string): Promise<string> => {
	let value
	const values = attribute.schema.properties.value.enum
	if (values) {
		const config = {
			itemName: 'value',
			primaryKeyName: 'value',
			sortKeyName: 'value',
			listTableFieldDefinitions: ['value'],
		}

		const listItems = async (): Promise<CapabilityValueItem[]> => Promise.resolve(values.map(value => {
			return {value}
		}))

		value = await selectFromList(command, config, {listItems})
	} else {
		value = (await inquirer.prompt({
			type: 'input',
			name: 'value',
			message: `Enter '${name}' attribute value:`,
		})).value
	}
	return value
}
