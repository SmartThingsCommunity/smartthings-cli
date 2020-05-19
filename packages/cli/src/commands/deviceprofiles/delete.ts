import { DeviceProfile, Status } from '@smartthings/core-sdk'
import { ListableObjectOutputCommand } from '@smartthings/cli-lib'

export default class DeviceProfileDeleteCommand extends ListableObjectOutputCommand<DeviceProfile, Status> {
	static description = 'Delete a device profile'

	static flags = ListableObjectOutputCommand.flags

	static args = [{
		name: 'id',
		description: 'Device profile UUID or number in the list',
		required: true,
	}]

	static examples = [
		'$ smartthings deviceprofiles:delete 63b8c91e-9686-4c43-9afb-fbd9f77e3bb0  #delete profile with this UUID',
		'$ smartthings deviceprofiles:delete 5                                     #delete the 5th profile in the list',
	]

	protected primaryKeyName(): string { return 'id' }
	protected sortKeyName(): string { return 'name' }

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceProfileDeleteCommand)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => { return this.client.deviceProfiles.list() },
			(id) => { return this.client.deviceProfiles.delete(id) },
		)
	}
}
