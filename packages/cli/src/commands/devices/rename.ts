import inquirer from 'inquirer'

import { APICommand, outputItem } from '@smartthings/cli-lib'

import { buildTableOutput, chooseDevice } from '../devices'


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
		const { args, argv, flags } = this.parse(DeviceRenameCommand)
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
