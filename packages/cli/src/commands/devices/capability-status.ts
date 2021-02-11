import inquirer from 'inquirer'

import { Device, CapabilityStatus } from '@smartthings/core-sdk'
import {APICommand, SelectingOutputAPICommand, isIndexArgument} from '@smartthings/cli-lib'
import {prettyPrintAttribute} from './status'
import {getComponentFromInput} from './component-status'


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
	static description = "get the current status of all of a device capability's attributes"

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

	protected getComponentFromInput = getComponentFromInput

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceCapabilityStatusCommand)
		await super.setup(args, argv, flags)

		await this.processNormally(
			args.id,
			() => this.client.devices.list(),
			async (id) => {
				let component = args.component
				let capability = args.capability
				if (!component) {
					const device = await this.client.devices.get(id)
					component = await this.getComponentFromInput(device)
					if (!capability) {
						const item = device.components?.find(it => it.id === component)
						if (item && item.capabilities) {
							this.log('\nCapabilities:')
							let index = 1
							const table = this.tableGenerator.newOutputTable()
							let first = true
							for (const cap of item.capabilities) {
								if (first) {
									table.push([index, `${cap.id} (default)`])
									first = false
								} else {
									table.push([index, cap.id])
								}
								index++
							}
							this.log(table.toString())
							const input = (await inquirer.prompt({
								type: 'input',
								name: 'capability',
								message: 'Enter capability id',
							})).capability || item.capabilities[0].id

							if (isIndexArgument(input)) {
								capability = item.capabilities[Number.parseInt(input) - 1].id
							} else if (input.length) {
								capability = input
							} else {
								capability = item.capabilities[0].id
							}
						}
					}
				}
				return this.client.devices.getCapabilityStatus(id, component, capability)
			},
		)
	}
}
