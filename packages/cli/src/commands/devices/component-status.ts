import inquirer from 'inquirer'

import { Device, ComponentStatus } from '@smartthings/core-sdk'
import {APICommand, SelectingOutputAPICommand, isIndexArgument} from '@smartthings/cli-lib'
import {prettyPrintAttribute} from './status'


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

export async function getComponentFromInput(this: APICommand, device: Device): Promise<string> {
	let component = 'main'
	if (device.components) {
		if (device.components.length > 1) {
			this.log('\nComponents:')
			let index = 1
			const table = this.tableGenerator.newOutputTable()
			for (const comp of device.components) {
				if (comp.id === 'main') {
					table.push([index, `${comp.id} (default)`])
				} else {
					table.push([index, comp.id])
				}
				index++
			}
			this.log(table.toString())

			const input = (await inquirer.prompt({
				type: 'input',
				name: 'component',
				message: 'Enter component id',
			})).component

			if (isIndexArgument(input)) {
				component = device.components[Number.parseInt(input) - 1].id || 'main'
			} else if (input.length) {
				component = input
			}
		} else {
			component = device.components[0].id || 'main'
		}
	}
	return component
}

export default class DeviceComponentStatusCommand extends SelectingOutputAPICommand<ComponentStatus, Device> {
	static description = "get the current status of a device component's attributes"

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

	protected getComponentFromInput = getComponentFromInput

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceComponentStatusCommand)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => this.client.devices.list(),
			async (id) => {
				let component = args.component
				if (!component) {
					const device = await this.client.devices.get(id)
					component = await this.getComponentFromInput(device)
				}
				return this.client.devices.getComponentStatus(id, component)
			},
		)
	}
}
