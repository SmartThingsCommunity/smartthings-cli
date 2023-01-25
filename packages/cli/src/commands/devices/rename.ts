import inquirer from 'inquirer'

import { APICommand, chooseDevice, outputItem } from '@smartthings/cli-lib'

import { buildTableOutput } from '../../lib/commands/devices-util'


export default class DeviceRenameCommand extends APICommand<typeof DeviceRenameCommand.flags> {
	static description = 'rename a device' +
		this.apiDocsURL('updateDevice')

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
		const id = await chooseDevice(this, this.args.id)

		const label = this.args.label ?? (await inquirer.prompt({
			type: 'input',
			name: 'label',
			message: 'Enter new device label:',
		})).label

		await outputItem(this, { buildTableOutput: data => buildTableOutput(this.tableGenerator, data) },
			() => this.client.devices.update(id, { label }))
	}
}
