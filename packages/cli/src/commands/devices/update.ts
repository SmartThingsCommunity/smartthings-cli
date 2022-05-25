import { Device, DeviceUpdate } from '@smartthings/core-sdk'

import { APICommand, chooseDevice, inputAndOutputItem } from '@smartthings/cli-lib'

import { buildTableOutput } from '../../lib/commands/devices/devices-util'


export default class DeviceUpdateCommand extends APICommand<typeof DeviceUpdateCommand.flags> {
	static description = "update a device's label and room"

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
		const id = await chooseDevice(this, this.args.id)
		await inputAndOutputItem<DeviceUpdate, Device>(this,
			{ buildTableOutput: data => buildTableOutput(this.tableGenerator, data) },
			(_, data) => this.client.devices.update(id, data))
	}
}
