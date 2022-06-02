import { Device, DeviceIntegrationType, DeviceUpdate } from '@smartthings/core-sdk'

import { APICommand, chooseDevice, inputAndOutputItem } from '@smartthings/cli-lib'

import { buildTableOutput } from '../../lib/commands/devices/devices-util'


export default class VirtualDeviceUpdateCommand extends APICommand<typeof VirtualDeviceUpdateCommand.flags> {
	static description = "update a virtual device's label and room"

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
		const id = await chooseDevice(this, this.args.id, { deviceListOptions: { type: DeviceIntegrationType.VIRTUAL } })
		await inputAndOutputItem<DeviceUpdate, Device>(this,
			{ buildTableOutput: data => buildTableOutput(this.tableGenerator, data) },
			(_, data) => this.client.devices.update(id, data))
	}
}
