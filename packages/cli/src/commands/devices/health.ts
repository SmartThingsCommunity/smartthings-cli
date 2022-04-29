import { APICommand, chooseDevice, formatAndWriteItem } from '@smartthings/cli-lib'


export default class DeviceHealthCommand extends APICommand<typeof DeviceHealthCommand.flags> {
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
		const deviceId = await chooseDevice(this, this.args.id, { allowIndex: true })
		const health = await this.client.devices.getHealth(deviceId)
		await formatAndWriteItem(this, { tableFieldDefinitions: ['deviceId', 'state', 'lastUpdatedDate'] }, health)
	}
}
