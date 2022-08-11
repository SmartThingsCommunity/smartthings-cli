import { DeviceProfile } from '@smartthings/core-sdk'

import { APIOrganizationCommand, OutputItemOrListConfig, outputItemOrList } from '@smartthings/cli-lib'

import { buildTableOutput, DeviceDefinition } from '../../lib/commands/deviceprofiles-util'
import { prunePresentation } from '../../lib/commands/deviceprofiles/view-util'


export default class DeviceProfilesViewCommand extends APIOrganizationCommand<typeof DeviceProfilesViewCommand.flags> {
	static description = 'show device profile and device configuration in a single, consolidated view'

	static flags = {
		...APIOrganizationCommand.flags,
		...outputItemOrList.flags,
	}

	static args = [{
		name: 'id',
		description: 'device profile UUID or the number from list',
	}]

	static aliases = ['device-profiles:view']

	async run(): Promise<void> {
		const config: OutputItemOrListConfig<DeviceDefinition, DeviceProfile> = {
			primaryKeyName: 'id',
			sortKeyName: 'name',
			buildTableOutput: data => buildTableOutput(this.tableGenerator, data),
		}

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

		await outputItemOrList(this, config, this.args.id,
			() => this.client.deviceProfiles.list(),
			getDeviceProfileAndConfig)
	}
}
