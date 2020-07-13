import { Device, CapabilityStatus } from '@smartthings/core-sdk'

import {APICommand, SelectingOutputAPICommand} from '@smartthings/cli-lib'


function prettyPrintAttribute(value: unknown): string {
	let result = JSON.stringify(value)
	if (result.length > 50) {
		result = JSON.stringify(value, null, 2)
	}
	return result
}

export function buildTableOutput(this: APICommand, capability: CapabilityStatus): string {
	const table = this.tableGenerator.newOutputTable({head: ['Attribute','Value']})

	for (const attributeName of Object.keys(capability)) {
		const attribute = capability[attributeName]
		table.push([
			attributeName,
			attribute.value !== null ?
				`${prettyPrintAttribute(attribute.value)}${attribute.unit ? ' ' + attribute.unit : ''}` : ''])
	}
	return table.toString()
}

export default class DeviceCapabilityStatusCommand extends SelectingOutputAPICommand<CapabilityStatus, Device> {
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
		{
			name: 'capability',
			description: 'the capability id',
		},
	]

	protected buildTableOutput = buildTableOutput

	primaryKeyName = 'deviceId'
	sortKeyName = 'label'
	listTableFieldDefinitions = ['label', 'name', 'type', 'deviceId']
	acceptIndexId = true
	inputPrompt = 'Enter id or index, component, and capability'

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceCapabilityStatusCommand)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => this.client.devices.list(),
			(id, argv) => {
				const component = argv && argv.length > 0 ? argv[0] : args.component
				const capability = argv && argv.length > 0 ? argv[1] : args.capability
				return this.client.devices.getCapabilityStatus(id, component, capability)
			},
		)
	}
}
