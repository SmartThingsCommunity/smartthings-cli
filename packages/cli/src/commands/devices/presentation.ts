import { APICommand, formatAndWriteItem } from '@smartthings/cli-lib'

import { buildTableOutput } from '../presentation'
import { chooseDevice } from '../devices'


export const tableFieldDefinitions = ['clientName', 'scope', 'redirectUris']

export default class DevicePresentationCommand extends APICommand {
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
		const { args, argv, flags } = this.parse(DevicePresentationCommand)
		await super.setup(args, argv, flags)

		const deviceId = await chooseDevice(this, args.id)
		const presentation = await this.client.devices.getPresentation(deviceId)
		await formatAndWriteItem(this, { buildTableOutput: data => buildTableOutput(this.tableGenerator, data) }, presentation)
	}
}
