import { DeviceProfile, DeviceProfileStatus } from '@smartthings/core-sdk'
import { ListableObjectOutputCommand } from '@smartthings/cli-lib'

export default class DeviceProfilePublishCommand extends ListableObjectOutputCommand<DeviceProfile, DeviceProfile> {
	static description = 'Publishes a device profile. Published profiles cannot be modified'

	static flags = ListableObjectOutputCommand.flags

	static args = [{
		name: 'id',
		description: 'Device profile UUID or number in the list',
		required: true,
	}]

	static examples = [
		'$ smartthings deviceprofiles:publish 63b8c91e-9686-4c43-9afb-fbd9f77e3bb0  #publish the profile with this UUID',
		'$ smartthings deviceprofiles:publish 5                                     #publish the 5th profile in the list',
	]

	protected primaryKeyName(): string { return 'id' }
	protected sortKeyName(): string { return 'name' }

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceProfilePublishCommand)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => { return this.client.deviceProfiles.list() },
			(id) => {
				return this.client.deviceProfiles.updateStatus(id, DeviceProfileStatus.PUBLISHED)
			 },
		)
	}
}
