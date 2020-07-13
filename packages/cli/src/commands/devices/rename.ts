import { Device } from '@smartthings/core-sdk'

import { SelectingOutputAPICommand } from '@smartthings/cli-lib'

import { buildTableOutput } from '../devices'


export default class DeviceComponentStatusCommand extends SelectingOutputAPICommand<Device, Device> {
	static description = "get the current status of all of a device's component's attributes"

	static flags = SelectingOutputAPICommand.flags

	static args = [
		{
			name: 'id',
			description: 'the device id',
		},
		{
			name: 'label',
			description: 'the new device label',
		},
	]

	protected buildTableOutput = buildTableOutput

	primaryKeyName = 'deviceId'
	sortKeyName = 'label'
	listTableFieldDefinitions = ['label', 'name', 'type', 'deviceId']
	acceptIndexId = true
	inputPrompt = 'Enter <id or index> <new label>'

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceComponentStatusCommand)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => this.client.devices.list(),
			(id, argv) => {
				const label = argv && argv.length > 0 ? argv[0] : args.label
				return this.client.devices.update(id, {label})
			},
		)
	}
}
