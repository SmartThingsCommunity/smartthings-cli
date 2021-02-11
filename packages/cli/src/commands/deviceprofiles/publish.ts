import { DeviceProfile, DeviceProfileStatus } from '@smartthings/core-sdk'

import { SelectingOutputAPICommand } from '@smartthings/cli-lib'

import { buildTableOutput } from '../deviceprofiles'


export default class DeviceProfilePublishCommand extends SelectingOutputAPICommand<DeviceProfile, DeviceProfile> {
	static description = 'publish a device profile (published profiles cannot be modified)'

	static flags = SelectingOutputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'device profile UUID or number in the list',
	}]

	primaryKeyName = 'id'
	sortKeyName = 'name'
	listTableFieldDefinitions = ['name', 'status', 'id']

	protected buildTableOutput: (data: DeviceProfile) => string = data => buildTableOutput(this.tableGenerator, data)

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceProfilePublishCommand)
		await super.setup(args, argv, flags)

		await this.processNormally(
			args.id,
			() => { return this.client.deviceProfiles.list() },
			(id) => { return this.client.deviceProfiles.updateStatus(id, DeviceProfileStatus.PUBLISHED) },
		)
	}
}
