import { DeviceProfileStatus } from '@smartthings/core-sdk'

import { APIOrganizationCommand, formatAndWriteItem } from '@smartthings/cli-lib'

import { buildTableOutput, chooseDeviceProfile } from '../../lib/commands/deviceprofiles-util.js'


export default class DeviceProfilePublishCommand extends APIOrganizationCommand<typeof DeviceProfilePublishCommand.flags> {
	static description = 'publish a device profile (published profiles cannot be modified)'

	static flags = {
		...APIOrganizationCommand.flags,
		...formatAndWriteItem.flags,
	}

	static args = [{
		name: 'id',
		description: 'device profile id',
	}]

	async run(): Promise<void> {
		const id = await chooseDeviceProfile(this, this.args.id)

		const deviceProfile = await this.client.deviceProfiles.updateStatus(id, DeviceProfileStatus.PUBLISHED)
		await formatAndWriteItem(this, { buildTableOutput: data => buildTableOutput(this.tableGenerator, data) }, deviceProfile)
	}
}
