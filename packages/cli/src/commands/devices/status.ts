import { DeviceStatus } from '@smartthings/core-sdk'

import { APICommand, formatAndWriteItem, TableGenerator } from '@smartthings/cli-lib'

import { chooseDevice } from '../../lib/commands/devices/devices-util'


export function prettyPrintAttribute(value: unknown): string {
	let result = JSON.stringify(value)
	if (result.length > 50) {
		result = JSON.stringify(value, null, 2)
	}
	return result
}

export function buildTableOutput(tableGenerator: TableGenerator, data: DeviceStatus): string {
	let output = ''
	if (data.components) {
		const componentIds = Object.keys(data.components)
		for (const componentId of componentIds) {
			const table = tableGenerator.newOutputTable({head: ['Capability', 'Attribute','Value']})
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

export default class DeviceStatusCommand extends APICommand {
	static description = "get the current status of all of a device's component's attributes"

	static flags = {
		...APICommand.flags,
		...formatAndWriteItem.flags,
	}

	static args = [{
		name: 'id',
		description: 'the device id',
	}]

	async run(): Promise<void> {
		const { args, argv, flags } = await this.parse(DeviceStatusCommand)
		await super.setup(args, argv, flags)

		const deviceId = await chooseDevice(this, args.id, { allowIndex: true })
		const presentation = await this.client.devices.getStatus(deviceId)
		await formatAndWriteItem(this, { buildTableOutput: data => buildTableOutput(this.tableGenerator, data) }, presentation)
	}
}
