import { DeviceProfileStatus } from '@smartthings/core-sdk'

import { APICommand, formatAndWriteItem } from '@smartthings/cli-lib'

import { buildTableOutput, chooseDeviceProfile } from '../deviceprofiles'


export default class DeviceProfilePublishCommand extends APICommand {
	static description = 'publish a device profile (published profiles cannot be modified)'

	static flags = {
		...APICommand.flags,
		...formatAndWriteItem.flags,
	}

	static args = [{
		name: 'id',
		description: 'device profile id',
	}]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceProfilePublishCommand)
		await super.setup(args, argv, flags)

		const id = await chooseDeviceProfile(this, args.id)

		const deviceProfile = await this.client.deviceProfiles.updateStatus(id, DeviceProfileStatus.PUBLISHED)
		await formatAndWriteItem(this, { buildTableOutput: data => buildTableOutput(this.tableGenerator, data) }, deviceProfile)
	}
}
