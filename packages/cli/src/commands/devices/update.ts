import { Device, DeviceUpdate } from '@smartthings/core-sdk'

import { APICommand, inputAndOutputItem } from '@smartthings/cli-lib'

import { buildTableOutput, chooseDevice } from '../../lib/commands/devices/devices-util'


export default class DeviceUpdateCommand extends APICommand {
	static description = "get the current status of all of a device's component's attributes"

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
	}

	static args = [
		{
			name: 'id',
			description: 'the device id',
		},
	]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceUpdateCommand)
		await super.setup(args, argv, flags)

		const id = await chooseDevice(this, args.id)
		await inputAndOutputItem<DeviceUpdate, Device>(this,
			{ buildTableOutput: data => buildTableOutput(this.tableGenerator, data) },
			(_, data) => this.client.devices.update(id, data))
	}
}
