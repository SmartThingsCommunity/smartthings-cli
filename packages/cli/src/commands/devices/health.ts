import { APICommand, formatAndWriteItem } from '@smartthings/cli-lib'

import { chooseDevice } from '../devices'


export default class DeviceHealthCommand extends APICommand {
	static description = 'get the current health status of a device'

	static flags = {
		...APICommand.flags,
		...formatAndWriteItem.flags,
	}

	static args = [{
		name: 'id',
		description: 'the device id',
	}]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceHealthCommand)
		await super.setup(args, argv, flags)

		const deviceId = await chooseDevice(this, args.id)
		const health = await this.client.devices.getHealth(deviceId)
		await formatAndWriteItem(this, { tableFieldDefinitions: ['deviceId', 'state', 'lastUpdatedDate'] }, health)
	}
}
