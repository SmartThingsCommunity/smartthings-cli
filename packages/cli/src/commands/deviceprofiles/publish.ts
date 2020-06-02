import { DeviceProfile, DeviceProfileStatus } from '@smartthings/core-sdk'

import { OutputAPICommand } from '@smartthings/cli-lib'
import { buildTableOutput } from '../deviceprofiles'


export default class DeviceProfilePublishCommand extends OutputAPICommand<DeviceProfile> {
	static description = 'publish a device profile (published profiles cannot be modified)'

	static flags = OutputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'Device profile UUID or number in the list',
		required: true,
	}]

	primaryKeyName = 'id'
	sortKeyName = 'name'

	static examples = [
		'$ smartthings deviceprofiles:publish 63b8c91e-9686-4c43-9afb-fbd9f77e3bb0  # publish the profile with this UUID',
		'$ smartthings deviceprofiles:publish 5                                     # publish the 5th profile in the list',
	]

	protected buildTableOutput(deviceProfile: DeviceProfile): string {
		return buildTableOutput(this, deviceProfile)
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceProfilePublishCommand)
		await super.setup(args, argv, flags)

		this.processNormally(() => { return this.client.deviceProfiles.updateStatus(args.id, DeviceProfileStatus.PUBLISHED) })
	}
}
