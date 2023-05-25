import { APICommand, chooseDevice, formatAndWriteItem } from '@smartthings/cli-lib'

import { buildTableOutput } from '../presentation.js'


export const tableFieldDefinitions = ['clientName', 'scope', 'redirectUris']

export default class DevicePresentationCommand extends APICommand<typeof DevicePresentationCommand.flags> {
	static description = 'get a device presentation'

	static flags = {
		...APICommand.flags,
		...formatAndWriteItem.flags,
	}

	static args = [{
		name: 'id',
		description: 'the device id or number in the list',
	}]

	async run(): Promise<void> {
		const deviceId = await chooseDevice(this, this.args.id, { allowIndex: true })
		const presentation = await this.client.devices.getPresentation(deviceId)
		await formatAndWriteItem(this, { buildTableOutput: data => buildTableOutput(this.tableGenerator, data) }, presentation)
	}
}
