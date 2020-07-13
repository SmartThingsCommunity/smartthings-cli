import { Device, ComponentStatus } from '@smartthings/core-sdk'

import {APICommand, SelectingOutputAPICommand} from '@smartthings/cli-lib'


function prettyPrintAttribute(value: unknown): string {
	let result = JSON.stringify(value)
	if (result.length > 50) {
		result = JSON.stringify(value, null, 2)
	}
	return result
}

export function buildTableOutput(this: APICommand, component: ComponentStatus): string {
	const table = this.tableGenerator.newOutputTable({head: ['Capability', 'Attribute','Value']})
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
	return table.toString()
}

export default class DeviceComponentStatusCommand extends SelectingOutputAPICommand<ComponentStatus, Device> {
	static description = "get the current status of all of a device's component's attributes"

	static flags = SelectingOutputAPICommand.flags

	static args = [
		{
			name: 'id',
			description: 'the device id',
		},
		{
			name: 'component',
			description: 'the component id',
		},
	]

	protected buildTableOutput = buildTableOutput

	primaryKeyName = 'deviceId'
	sortKeyName = 'label'
	listTableFieldDefinitions = ['label', 'name', 'type', 'deviceId']
	acceptIndexId = true
	inputPrompt = 'Enter id or index and component'

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceComponentStatusCommand)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => this.client.devices.list(),
			(id, argv) => {
				const component = argv && argv.length > 0 ? argv[0] : args.component
				return this.client.devices.getComponentStatus(id, component)
			},
		)
	}
}
