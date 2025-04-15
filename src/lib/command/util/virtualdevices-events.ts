import { type DeviceEvent, type SmartThingsClient } from '@smartthings/core-sdk'

import { fatalError } from '../../util.js'
import { type APICommand } from '../api-command.js'
import { chooseComponentFn } from './devices-choose.js'
import { chooseAttribute, chooseCapability, chooseUnit, chooseValue } from './virtualdevices.js'


export type EventCreateFlags = {
	deviceId?: string
	name?: string
	value?: string
	unit?: string
}

export const convertAttributeValue = (attributeType: string | undefined, attributeValue: string): unknown => {
	switch (attributeType) {
		case 'integer':
			return parseInt(attributeValue)
		case 'number':
			return parseFloat(attributeValue)
		case 'array':
		case 'object':
			return JSON.parse(attributeValue)
		default:
			return attributeValue
	}
}

export const parseDeviceEvent = async (
		client: SmartThingsClient,
		attributeName: string,
		attributeValue: string,
		unit?: string,
): Promise<DeviceEvent> => {
	const segments = attributeName.split(':')
	if (segments.length < 2 || segments.length > 3) {
		return fatalError('Invalid attribute name. Format is: [<component>]:<capability>:<attribute>')
	}

	const [component, capabilityId, attributeId] = segments.length === 3
		? [segments[0], segments[1], segments[2]]
		: ['main', segments[0], segments[1]]
	const event: DeviceEvent = {
		component,
		capability: capabilityId,
		attribute: attributeId,
		value: attributeValue,
		unit,
	}

	const capability = await client.capabilities.get(event.capability, 1)
	if (!capability || !capability.attributes) {
		return fatalError(`Capability ${event.capability} not valid.`)
	}

	const attribute = capability.attributes[event.attribute]
	if (!attribute) {
		return fatalError(`Attribute ${event.attribute} not found in capability ${capability.id}.`)
	}

	event.value = convertAttributeValue(attribute.schema.properties.value.type, attributeValue)

	return event
}

export const getInputFromUser = async (
		command: APICommand,
		argv: EventCreateFlags,
		deviceId: string,
): Promise<DeviceEvent[]> => {
	const attributeName = argv.name
	const attributeValue = argv.value
	let events: DeviceEvent[] = []

	if (attributeName) {
		if (attributeValue) {
			const event = await parseDeviceEvent(command.client, attributeName, attributeValue, argv.unit)
			events = [event]
		} else {
			return fatalError('Attribute name specified without attribute value.')
		}
	} else {
		const device = await command.client.devices.get(deviceId)
		const componentId = await chooseComponentFn(device)(command)
		const component = device.components?.find(component => component.id === componentId)
		if (!component) {
			return fatalError(`Unexpectedly could not find component with id ${componentId}.`)
		}
		const capability = await chooseCapability(command, component)
		const { attributeName, attribute } = await chooseAttribute(command, capability)
		const value = await chooseValue(command, attribute, attributeName)
		const unit = await chooseUnit(command, attribute)

		events = [
			{
				component: component.id,
				capability: capability.id,
				attribute: attributeName,
				value: convertAttributeValue(attribute.schema.properties.value.type, value),
				unit,
			},
		]
	}
	return events
}
