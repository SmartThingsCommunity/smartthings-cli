import { APICommand, formatAndWriteItem } from '@smartthings/cli-lib'

import { chooseDevice } from '../../lib/commands/devices/devices-util'
import { buildTableOutput } from '../presentation'


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

		const deviceId = await chooseDevice(this, args.id, { allowIndex: true })
		const presentation = await this.client.devices.getPresentation(deviceId)
		await formatAndWriteItem(this, { buildTableOutput: data => buildTableOutput(this.tableGenerator, data) }, presentation)
	}
}
