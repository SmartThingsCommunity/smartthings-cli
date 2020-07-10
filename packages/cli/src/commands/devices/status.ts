import { Device, DeviceStatus } from '@smartthings/core-sdk'

import {SelectingOutputAPICommand} from '@smartthings/cli-lib'


export default class DeviceStatusCommand extends SelectingOutputAPICommand<DeviceStatus, Device> {
	static description = "get the current status of all of a device's component's attributes"

	static flags = SelectingOutputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'the device id',
	}]

	primaryKeyName = 'deviceId'
	sortKeyName = 'label'
	listTableFieldDefinitions = ['label', 'name', 'type', 'deviceId']
	acceptIndexId = true

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceStatusCommand)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => this.client.devices.list(),
			(id) => this.client.devices.getStatus(id),
		)
	}
}
