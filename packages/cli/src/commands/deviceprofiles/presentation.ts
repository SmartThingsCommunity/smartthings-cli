import { DeviceProfile, PresentationDevicePresentation } from '@smartthings/core-sdk'

import {SelectingOutputAPICommand} from '@smartthings/cli-lib'

import { buildTableOutput } from '../presentation'


export default class ProfilePresentationCommand extends SelectingOutputAPICommand<PresentationDevicePresentation, DeviceProfile> {
	static description = 'get the presentation associated with a device profile'

	static flags = SelectingOutputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'device profile UUID or the number of the profile from list',
	}]

	primaryKeyName = 'id'
	sortKeyName = 'name'
	listTableFieldDefinitions = ['name', 'status', 'id']
	acceptIndexId = true

	protected buildTableOutput(presentation: PresentationDevicePresentation): string {
		return buildTableOutput(presentation, this.tableGenerator)
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(ProfilePresentationCommand	)
		await super.setup(args, argv, flags)

		this.processNormally(
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
