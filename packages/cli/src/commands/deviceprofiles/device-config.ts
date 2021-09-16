import { CLIError } from '@oclif/errors'

import { APIOrganizationCommand, formatAndWriteItem } from '@smartthings/cli-lib'

import { buildTableOutput } from '../presentation/device-config'
import { chooseDeviceProfile } from '../deviceprofiles'


export default class DeviceProfileDeviceConfigCommand extends APIOrganizationCommand {
	static description = 'get the device configuration associated with a device profile'

	static flags = {
		...APIOrganizationCommand.flags,
		...formatAndWriteItem.flags,
	}

	static args = [{
		name: 'id',
		description: 'device profile id or the number in list',
	}]

	static aliases = ['device-profiles:device-config']

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceProfileDeviceConfigCommand)
		await super.setup(args, argv, flags)

		const id = await chooseDeviceProfile(this, args.id, { allowIndex: true })

		const profile = await this.client.deviceProfiles.get(id)
		if (!profile.metadata) {
			throw new CLIError('No presentation defined for device profile')
		}
		const deviceConfig = await this.client.presentation.get(profile.metadata.vid, profile.metadata.mnmn)
		await formatAndWriteItem(this, { buildTableOutput: data => buildTableOutput(this.tableGenerator, data) }, deviceConfig)
	}
}
