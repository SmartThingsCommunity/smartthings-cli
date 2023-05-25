import { APICommand, chooseDevice, formatAndWriteItem } from '@smartthings/cli-lib'

import { buildStatusTableOutput } from '../../lib/commands/devices-util.js'


export default class DeviceStatusCommand extends APICommand<typeof DeviceStatusCommand.flags> {
	static description = "get the current status of all of a device's component's attributes" +
		this.apiDocsURL('getDeviceStatus')

	static flags = {
		...APICommand.flags,
		...formatAndWriteItem.flags,
	}

	static args = [{
		name: 'id',
		description: 'the device id',
	}]

	async run(): Promise<void> {
		const deviceId = await chooseDevice(this, this.args.id, { allowIndex: true })
		const presentation = await this.client.devices.getStatus(deviceId)
		await formatAndWriteItem(this, { buildTableOutput: data =>
			buildStatusTableOutput(this.tableGenerator, data) }, presentation)
	}
}
