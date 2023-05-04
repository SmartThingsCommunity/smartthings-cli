import { APIOrganizationCommand, formatAndWriteItem } from '@smartthings/cli-lib'

import { buildTableOutput, chooseDeviceProfile, DeviceDefinition } from '../../lib/commands/deviceprofiles-util'
import { prunePresentation } from '../../lib/commands/deviceprofiles/view-util'


export default class DeviceProfilesViewCommand extends APIOrganizationCommand<typeof DeviceProfilesViewCommand.flags> {
	static description = 'show device profile and device configuration in a single, consolidated view' +
		this.apiDocsURL('getDeviceProfile, getDeviceConfiguration')

	static flags = {
		...APIOrganizationCommand.flags,
		...formatAndWriteItem.flags,
	}

	static args = [{
		name: 'id',
		description: 'device profile UUID or the number from list',
	}]

	async run(): Promise<void> {
		const getDeviceProfileAndConfig = async (id: string): Promise<DeviceDefinition> => {
			const profile = await this.client.deviceProfiles.get(id)
			if (profile.metadata) {
				try {
					const view = await this.client.presentation.get(profile.metadata.vid, profile.metadata.mnmn)
					return { ...profile, view: prunePresentation(view) }
				} catch (error) {
					this.logger.warn(error)
					return profile
				}
			}
			return profile
		}

		const profileId = await chooseDeviceProfile(this, this.args.id, { allowIndex: true })
		const profileAndConfig = await (getDeviceProfileAndConfig(profileId))
		await formatAndWriteItem(this, { buildTableOutput: data => buildTableOutput(this.tableGenerator, data) }, profileAndConfig)
	}
}
