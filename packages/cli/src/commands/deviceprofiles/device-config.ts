import { Errors } from '@oclif/core'

import { APIOrganizationCommand, formatAndWriteItem } from '@smartthings/cli-lib'

import { buildTableOutput } from '../presentation/device-config'
import { chooseDeviceProfile } from '../../lib/commands/deviceprofiles-util'


export default class DeviceProfileDeviceConfigCommand extends APIOrganizationCommand<typeof DeviceProfileDeviceConfigCommand.flags> {
	static description = 'get the device configuration associated with a device profile'

	static flags = {
		...APIOrganizationCommand.flags,
		...formatAndWriteItem.flags,
	}

	static args = [{
		name: 'id',
		description: 'device profile id or the number in list',
	}]

	async run(): Promise<void> {
		const id = await chooseDeviceProfile(this, this.args.id, { allowIndex: true })

		const profile = await this.client.deviceProfiles.get(id)
		if (!profile.metadata) {
			throw new Errors.CLIError('No presentation defined for device profile')
		}
		const deviceConfig = await this.client.presentation.get(profile.metadata.vid, profile.metadata.mnmn)
		await formatAndWriteItem(this, { buildTableOutput: data => buildTableOutput(this.tableGenerator, data) }, deviceConfig)
	}
}
