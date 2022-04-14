import inquirer from 'inquirer'

import { APICommand, chooseDevice, outputItem } from '@smartthings/cli-lib'

import { buildTableOutput } from '../../lib/commands/devices/devices-util'


export default class DeviceRenameCommand extends APICommand {
	static description = 'rename a device'

	static flags = {
		...APICommand.flags,
		...outputItem.flags,
	}

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

	async run(): Promise<void> {
		const { args, argv, flags } = await this.parse(DeviceRenameCommand)
		await super.setup(args, argv, flags)

		const id = await chooseDevice(this, args.id)

		const label = args.label ?? (await inquirer.prompt({
			type: 'input',
			name: 'label',
			message: 'Enter new device label:',
		})).label

		await outputItem(this, { buildTableOutput: data => buildTableOutput(this.tableGenerator, data) },
			() => this.client.devices.update(id, { label }))
	}
}
