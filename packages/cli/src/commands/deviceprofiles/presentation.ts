import { CLIError } from '@oclif/errors'

import { APIOrganizationCommand, formatAndWriteItem } from '@smartthings/cli-lib'

import { buildTableOutput } from '../presentation'
import { chooseDeviceProfile } from '../deviceprofiles'


export default class DeviceProfilePresentationCommand extends APIOrganizationCommand {
	static description = 'get the presentation associated with a device profile'

	static flags = {
		...APIOrganizationCommand.flags,
		...formatAndWriteItem.flags,
	}

	static args = [{
		name: 'id',
		description: 'device profile UUID or the number of the profile from list',
	}]

	static examples = [
		'$ smartthings deviceprofiles:presentation fd4adb7f-4a23-4134-9b39-05ed889a03cf',
		'$ smartthings deviceprofiles:presentation fd4adb7f-4a23-4134-9b39-05ed889a03cf --language=ko',
		'$ smartthings deviceprofiles:presentation fd4adb7f-4a23-4134-9b39-05ed889a03cf --language=NONE',
		'',
		'Specifying only the presentationId defaults to the "SmartThingsCommunity" manufacturer',
		'name and the language set for the computer\'s operating system. The language can be',
		'overridden by specifying an ISO language code. If "NONE" is specified for the language',
		'flag then no language header is specified in the API request',
	]

	static aliases = ['device-profiles:presentation']

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceProfilePresentationCommand)
		await super.setup(args, argv, flags)

		const id = await chooseDeviceProfile(this, args.id, { allowIndex: true })

		const profile = await this.client.deviceProfiles.get(id)
		if (!profile.metadata) {
			throw new CLIError('No presentation defined for device profile')
		}

		const presentation = await this.client.presentation.getPresentation(profile.metadata.vid, profile.metadata.mnmn)
		await formatAndWriteItem(this, { buildTableOutput: data => buildTableOutput(this.tableGenerator, data) }, presentation)
	}
}
