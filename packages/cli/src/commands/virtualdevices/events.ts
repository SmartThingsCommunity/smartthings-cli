import {
	DeviceEvent,
	DeviceIntegrationType,
} from '@smartthings/core-sdk'
import {
	APICommand,
	inputAndOutputItem,
	inputProcessor,
	selectFromList,
	stringFromUnknown,
	TableGenerator,
} from '@smartthings/cli-lib'
import { VirtualDeviceEventsResponse } from '@smartthings/core-sdk/dist/endpoint/virtualdevices'
import {
	chooseAttribute,
	chooseCapability,
	chooseComponent,
	chooseUnit,
	chooseValue,
} from '../../lib/commands/virtualdevices/virtualdevices-util'


function buildTableOutput(tableGenerator: TableGenerator, data: EventInputOutput): string {
	const { input, output } = data
	const table = tableGenerator.newOutputTable({ head: ['Component', 'Capability', 'Attribute', 'Value', 'State Change?'] })
	const { stateChanges } = output
	for (const index in input) {
		const event = input[index]
		const isStateChange = parseInt(index) < stateChanges.length ? stateChanges[index] : 'undefined'
		const value = stringFromUnknown(event.value)
		table.push([event.component, event.capability, event.attribute, value, isStateChange])
	}
	return table.toString()
}

interface EventInputOutput {
	input: DeviceEvent[]
	output: VirtualDeviceEventsResponse
}

export default class VirtualDeviceEventsCommand extends APICommand<typeof VirtualDeviceEventsCommand.flags> {
	static description = 'create events for a virtual device\n' +
		'The command can be run interactively, in question & answer mode, with command line parameters, ' +
		'or with input from a file or standard in.'

	static examples = [
		'$ smartthings virtualdevices:events                                                 # interactive mode',
		'$ smartthings virtualdevices:events <id> -i data.yml                                # from a YAML or JSON file',
		'$ smartthings virtualdevices:events <id> switch:switch on                           # command line input',
		'$ smartthings virtualdevices:events <id> temperatureMeasurement:temperature 22.5 C  # command line input',
	]

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
	}

	static args = [
		{
			name: 'id',
			description: 'the device id',
		},
		{
			name: 'name',
			description: 'the fully qualified attribute name [<component>]:<capability>:<attribute>',
		},
		{
			name: 'value',
			description: 'the attribute value',
		},
		{
			name: 'unit',
			description: 'optional unit of measure',
		},
	]

	async run(): Promise<void> {
		const config = {
			primaryKeyName: 'deviceId',
			sortKeyName: 'label',
			listTableFieldDefinitions: ['label', 'name', 'type', 'deviceId'],
		}

		const deviceId = await selectFromList(this, config, {
			preselectedId: this.args.id,
			listItems: () => this.client.devices.list({ type: DeviceIntegrationType.VIRTUAL }),
		})

		const createEvents = async (_: void, input: DeviceEvent[]): Promise<EventInputOutput> => {
			const output = await this.client.virtualDevices.createEvents(deviceId, input)
			return {
				input,
				output,
			}
		}
		await inputAndOutputItem<DeviceEvent[], EventInputOutput>(this, {
			buildTableOutput: (data: EventInputOutput) => buildTableOutput(this.tableGenerator, data),
		}, createEvents, inputProcessor(() => true, () => this.getInputFromUser(deviceId)))
	}

	async getInputFromUser(deviceId: string): Promise<DeviceEvent[]> {
		const attributeName = this.args.name
		const attributeValue = this.args.value
		let events: DeviceEvent[] = []

		if (attributeName) {
			if (attributeValue) {
				const event = await this.parseDeviceEvent(attributeName, attributeValue, this.args.unit)
				events = [event]
			} else {
				this.error('Attribute name specified without attribute value')
			}
		} else {
			const device = await this.client.devices.get(deviceId)
			const component = await chooseComponent(this, device)
			const capability = await chooseCapability(this, component)
			const { attributeName, attribute } = await chooseAttribute(this, capability)
			const value = await chooseValue(this, attribute, attributeName)
			const unit = await chooseUnit(this, attribute)

			events = [
				{
					component: component.id,
					capability: capability.id,
					attribute: attributeName,
					value: this.convertAttributeValue(attribute.schema.properties.value.type, value),
					unit,
				},
			]
		}
		return events
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	convertAttributeValue(attributeType: string | undefined, attributeValue: string): any {
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

	async parseDeviceEvent(attributeName: string, attributeValue: string, unitOfMeasure: string): Promise<DeviceEvent> {
		const segments = attributeName.split(':')
		if (segments.length < 2 || segments.length > 3) {
			this.error('Invalid attribute name')
		}

		const event: DeviceEvent = segments.length === 3 ? {
			component: segments[0],
			capability: segments[1],
			attribute: segments[2],
			value: attributeValue,
			unit: unitOfMeasure,
		} : {
			component: 'main',
			capability: segments[0],
			attribute: segments[1],
			value: attributeValue,
			unit: unitOfMeasure,
		}

		const capability = await this.client.capabilities.get(event.capability, 1)
		if (!capability || !capability.attributes) {
			this.error(`Capability ${event.capability} not valid`)
		}

		const attribute = capability.attributes[event.attribute]
		if (!attribute) {
			this.error(`Attribute ${event.attribute} not found in capability ${capability.id}`)
		}

		event.value = this.convertAttributeValue(attribute.schema.properties.value.type, attributeValue)

		return event
	}
}
