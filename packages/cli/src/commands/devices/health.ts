import { Device, DeviceHealth } from '@smartthings/core-sdk'
import {SelectingOutputAPICommand} from '@smartthings/cli-lib'


export default class DeviceHealthCommand extends SelectingOutputAPICommand<DeviceHealth, Device> {
	static description = 'get the current health status of a device'

	static flags = SelectingOutputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'the device id',
	}]

	primaryKeyName = 'deviceId'
	sortKeyName = 'label'
	listTableFieldDefinitions = ['label', 'name', 'type', 'deviceId']
	tableFieldDefinitions = ['deviceId', 'state', 'lastUpdatedDate']
	acceptIndexId = true

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceHealthCommand)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => this.client.devices.list(),
			(id) => this.client.devices.getHealth(id),
		)
	}
}
