import { DeviceProfile, PresentationDevicePresentation } from '@smartthings/core-sdk'

import {SelectingOutputAPICommand} from '@smartthings/cli-lib'

import { buildTableOutput } from '../presentation'


export default class DeviceProfilePresentationCommand extends SelectingOutputAPICommand<PresentationDevicePresentation, DeviceProfile> {
	static description = 'get the presentation associated with a device profile'

	static flags = SelectingOutputAPICommand.flags

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

	primaryKeyName = 'id'
	sortKeyName = 'name'
	listTableFieldDefinitions = ['name', 'status', 'id']
	acceptIndexId = true

	buildTableOutput = buildTableOutput

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceProfilePresentationCommand)
		await super.setup(args, argv, flags)

		await this.processNormally(
			args.id,
			() => { return this.client.deviceProfiles.list() },
			async (id) => {
				const profile = await this.client.deviceProfiles.get(id)
				if (profile.metadata) {
					return this.client.presentation.getPresentation(profile.metadata.vid, profile.metadata.mnmn)
				} else {
					this.logger.error('No presentation defined for device profile')
					// eslint-disable-next-line no-process-exit
					process.exit(1)
				}
			},
		)
	}
}
