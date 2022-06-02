import inquirer from 'inquirer'
import {
	CapabilityAttribute,
	CapabilityReference,
	Component,
	Device,
	DeviceProfile,
	DeviceProfileCreateRequest,
} from '@smartthings/core-sdk'

import {
	APICommand, APIOrganizationCommand, FileInputProcessor,
	selectFromList,
} from '@smartthings/cli-lib'
import { chooseDeviceProfile } from '../../../commands/deviceprofiles'


export const locallyExecutingPrototypes = [
	{ name: 'Switch', id: 'VIRTUAL_SWITCH' },
	{ name: 'Dimmer', id: 'VIRTUAL_DIMMER_SWITCH' },
	{ name: 'More...', id: 'more' },
]

export const allPrototypes = [
	{ name: 'Switch', id: 'VIRTUAL_SWITCH' },
	{ name: 'Dimmer Switch', id: 'VIRTUAL_DIMMER_SWITCH' },
	{ name: 'Button', id: 'VIRTUAL_BUTTON' },
	{ name: 'Camera', id: 'VIRTUAL_CAMERA' },
	{ name: 'Color Bulb', id: 'VIRTUAL_COLOR_BULB' },
	{ name: 'Contact Sensor', id: 'VIRTUAL_CONTACT_SENSOR' },
	{ name: 'Dimmer (no switch)', id: 'VIRTUAL_DIMMER' },
	{ name: 'Garage Door Opener', id: 'VIRTUAL_GARAGE_DOOR_OPENER' },
	{ name: 'Lock', id: 'VIRTUAL_LOCK' },
	{ name: 'Metered Switch', id: 'VIRTUAL_METERED_SWITCH' },
	{ name: 'Motion Sensor', id: 'VIRTUAL_MOTION_SENSOR' },
	{ name: 'Multi-Sensor', id: 'VIRTUAL_MULTI_SENSOR' },
	{ name: 'Presence Sensor', id: 'VIRTUAL_PRESENCE_SENSOR' },
	{ name: 'Refrigerator', id: 'VIRTUAL_REFRIGERATOR' },
	{ name: 'RGBW Bulb', id: 'VIRTUAL_RGBW_BULB' },
	{ name: 'Siren', id: 'VIRTUAL_SIREN' },
	{ name: 'Thermostat', id: 'VIRTUAL_THERMOSTAT' },
]

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

export interface DeviceProfileDefinition {
	deviceProfileId?: string
	deviceProfile?: DeviceProfileCreateRequest
}

export async function chooseDeviceName(command: APICommand<typeof APICommand.flags>, preselectedName?: string): Promise<string | undefined> {
	if (!preselectedName) {
		preselectedName = (await inquirer.prompt({
			type: 'input',
			name: 'deviceName',
			message: 'Device Name:',
		})).deviceName
	}
	return preselectedName
}

export async function chooseDeviceProfileDefinition(command: APIOrganizationCommand<typeof APIOrganizationCommand.flags>, deviceProfileId?: string, deviceProfileFile?: string): Promise<DeviceProfileDefinition> {
	let deviceProfile

	if (deviceProfileFile) {
		const inputProcessor = new FileInputProcessor<DeviceProfile>(deviceProfileFile)
		deviceProfile = await inputProcessor.read()
	} else if (!deviceProfileId) {
		deviceProfileId = await chooseDeviceProfile(command, deviceProfileId, { allowIndex: true })
	}

	return { deviceProfileId, deviceProfile }
}

export async function chooseDevicePrototype(command: APICommand<typeof APICommand.flags>, preselectedId?: string): Promise<string> {
	const config = {
		itemName: 'device prototype',
		primaryKeyName: 'id',
		listTableFieldDefinitions: ['name', 'id'],
	}
	let prototype = await selectFromList(command, config, {
		preselectedId,
		listItems: () => Promise.resolve(locallyExecutingPrototypes),
	})

	if (prototype === 'more') {
		prototype = await selectFromList(command, config, {
			listItems: () => Promise.resolve(allPrototypes),
		})
	}

	return prototype
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
			return { attributeName, attribute: attributes[attributeName] }
		})
		const listItems = async (): Promise<CapabilityAttributeItem[]> => Promise.resolve(attributeList)
		const preselectedId = attributeNames.length === 1 ? attributeNames[0] : undefined
		attributeName = await selectFromList(command, config, { preselectedId, listItems })
		attribute = attributes[attributeName]
	}

	if (!attributeName || !attribute) {
		throw new Error(`Attribute ${attributeName} not found`)
	}
	return { attributeName, attribute }
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
			return { unit }
		}))

		const preselectedId = units.length === 1 ? units[0] : undefined
		unit = await selectFromList(command, config, { preselectedId, listItems })
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
			return { value }
		}))

		value = await selectFromList(command, config, { listItems })
	} else {
		value = (await inquirer.prompt({
			type: 'input',
			name: 'value',
			message: `Enter '${name}' attribute value:`,
		})).value
	}
	return value
}
