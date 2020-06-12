import { Device } from '@smartthings/core-sdk'

import { SelectingAPICommand } from '@smartthings/cli-lib'


export default class DeviceDeleteCommand extends SelectingAPICommand<Device> {
	static description = 'delete a device'

	static flags = SelectingAPICommand.flags

	static args = [{
		name: 'id',
		description: 'device UUID',
	}]

	primaryKeyName = 'deviceId'
	sortKeyName = 'name'

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceDeleteCommand)
		await super.setup(args, argv, flags)

		this.processNormally(args.id,
			async () => await this.client.devices.list(),
			async (id) => { await this.client.devices.delete(id) },
			'device {{id}} deleted')
	}
}
