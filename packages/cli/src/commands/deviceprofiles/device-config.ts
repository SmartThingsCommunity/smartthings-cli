import { DeviceProfile, PresentationDeviceConfig } from '@smartthings/core-sdk'

import { ListingOutputAPICommand } from '@smartthings/cli-lib'

import { buildTableOutput } from '../presentation/device-config'


export default class ProfilePresentationCommand extends ListingOutputAPICommand<PresentationDeviceConfig, DeviceProfile> {
	static description = 'get the presentation associated with a device profile'

	static flags = ListingOutputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'device profile UUID or the number of the profile from list',
	}]

	primaryKeyName = 'id'
	sortKeyName = 'name'

	protected buildTableOutput(presentation: PresentationDeviceConfig): string {
		// @ts-ignore
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
					return this.client.presentation.get(profile.metadata.vid)
				} else {
					this.logger.error('No presentation defined for device profile')
					// eslint-disable-next-line no-process-exit
					process.exit(1)
				}
			},
		)
	}
}
