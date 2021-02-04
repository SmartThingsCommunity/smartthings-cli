import { Device, DeviceUpdate } from '@smartthings/core-sdk'
import { SelectingInputOutputAPICommand } from '@smartthings/cli-lib'
import { buildTableOutput } from '../devices'


export default class DeviceUpdateCommand extends SelectingInputOutputAPICommand<DeviceUpdate, Device, Device> {
	static description = "get the current status of all of a device's component's attributes"

	static flags = SelectingInputOutputAPICommand.flags

	static args = [
		{
			name: 'id',
			description: 'the device id',
		},
	]

	protected buildTableOutput: (data: Device) => string = data => buildTableOutput(this.tableGenerator, data)

	primaryKeyName = 'deviceId'
	sortKeyName = 'label'
	listTableFieldDefinitions = ['label', 'name', 'type', 'deviceId']
	acceptIndexId = true

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceUpdateCommand)
		await super.setup(args, argv, flags)

		await this.processNormally(
			args.id,
			() => this.client.devices.list(),
			(id, data) => {
				return this.client.devices.update(id, data)
			},
		)
	}
}
