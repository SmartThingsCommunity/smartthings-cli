import { DeviceProfileStatus } from '@smartthings/core-sdk'

import { APIOrganizationCommand, formatAndWriteItem } from '@smartthings/cli-lib'

import { buildTableOutput, chooseDeviceProfile } from '../deviceprofiles'


export default class DeviceProfilePublishCommand extends APIOrganizationCommand {
	static description = 'publish a device profile (published profiles cannot be modified)'

	static flags = {
		...APIOrganizationCommand.flags,
		...formatAndWriteItem.flags,
	}

	static args = [{
		name: 'id',
		description: 'device profile id',
	}]

	static aliases = ['device-profiles:publish']

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceProfilePublishCommand)
		await super.setup(args, argv, flags)

		const id = await chooseDeviceProfile(this, args.id)

		const deviceProfile = await this.client.deviceProfiles.updateStatus(id, DeviceProfileStatus.PUBLISHED)
		await formatAndWriteItem(this, { buildTableOutput: data => buildTableOutput(this.tableGenerator, data) }, deviceProfile)
	}
}
