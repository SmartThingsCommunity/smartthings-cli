import { Device, DeviceStatus } from '@smartthings/core-sdk'

import {APICommand, SelectingOutputAPICommand} from '@smartthings/cli-lib'


export function buildTableOutput(this: APICommand, data: DeviceStatus): string {
	let output = ''
	if (data.components) {
		for (const componentId of Object.keys(data.components)) {
			const table = this.tableGenerator.newOutputTable({head: ['Capability', 'Attribute','Value']})
			output += `\n${componentId} component\n`
			const component = data.components[componentId]
			for (const capabilityName of Object.keys(component)) {
				const capability = component[capabilityName]
				for (const attributeName of Object.keys(capability)) {
					const attribute = capability[attributeName]
					table.push([
						capabilityName,
						attributeName,
						attribute.value !== null ?
							`${JSON.stringify(attribute.value)}${attribute.unit ? ' ' + attribute.unit : ''}` : ''])
				}
			}
			output += table.toString()
			output += '\n'
		}
	}
	return output
}

export default class DeviceStatusCommand extends SelectingOutputAPICommand<DeviceStatus, Device> {
	static description = "get the current status of all of a device's component's attributes"

	static flags = SelectingOutputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'the device id',
	}]

	protected buildTableOutput = buildTableOutput

	primaryKeyName = 'deviceId'
	sortKeyName = 'label'
	listTableFieldDefinitions = ['label', 'name', 'type', 'deviceId']
	acceptIndexId = true

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceStatusCommand)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => this.client.devices.list(),
			(id) => this.client.devices.getStatus(id),
		)
	}
}
