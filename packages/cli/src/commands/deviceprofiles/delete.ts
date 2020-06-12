import { DeviceProfile } from '@smartthings/core-sdk'

import { SelectingAPICommand } from '@smartthings/cli-lib'


export default class DeviceProfileDeleteCommand extends SelectingAPICommand<DeviceProfile> {
	static description = 'delete a device profile'

	static flags = SelectingAPICommand.flags

	static args = [{
		name: 'id',
		description: 'Device profile UUID or number in the list',
	}]

	primaryKeyName = 'id'
	sortKeyName = 'name'

	static examples = [
		'$ smartthings deviceprofiles:delete 63b8c91e-9686-4c43-9afb-fbd9f77e3bb0  # delete profile with this UUID',
		'$ smartthings deviceprofiles:delete 5                                     # delete the 5th profile in the list',
	]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceProfileDeleteCommand)
		await super.setup(args, argv, flags)

		this.processNormally(args.id,
			async () => await this.client.deviceProfiles.list(),
			async (id) => { await this.client.deviceProfiles.delete(id) },
			'device profile {{id}} deleted')
	}
}
