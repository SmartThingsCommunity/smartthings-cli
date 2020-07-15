import inquirer from 'inquirer'

import { Device } from '@smartthings/core-sdk'
import { SelectingOutputAPICommand } from '@smartthings/cli-lib'
import { buildTableOutput } from '../devices'


export default class DeviceComponentStatusCommand extends SelectingOutputAPICommand<Device, Device> {
	static description = 'rename a device'

	static flags = SelectingOutputAPICommand.flags

	static args = [
		{
			name: 'id',
			description: 'the device id',
		},
		{
			name: 'label',
			description: 'the new device label',
		},
	]

	protected buildTableOutput = buildTableOutput

	primaryKeyName = 'deviceId'
	sortKeyName = 'label'
	listTableFieldDefinitions = ['label', 'name', 'type', 'deviceId']
	acceptIndexId = true

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceComponentStatusCommand)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => this.client.devices.list(),
			async (id) => {
				let label = args.label
				if (!label) {
					label = (await inquirer.prompt({
						type: 'input',
						name: 'label',
						message: 'Enter new device label:',
					})).label
				}
				return this.client.devices.update(id, {label})
			},
		)
	}
}
