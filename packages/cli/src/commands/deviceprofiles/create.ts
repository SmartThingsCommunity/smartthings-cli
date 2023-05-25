import { DeviceProfile } from '@smartthings/core-sdk'

import { APIOrganizationCommand, inputAndOutputItem, inputProcessor } from '@smartthings/cli-lib'

import { buildTableOutput, cleanupForCreate, DeviceDefinitionRequest } from '../../lib/commands/deviceprofiles-util.js'
import { createWithDefaultConfig, getInputFromUser } from '../../lib/commands/deviceprofiles/create-util.js'


export default class DeviceProfileCreateCommand extends APIOrganizationCommand<typeof DeviceProfileCreateCommand.flags> {
	static description = 'create a new device profile\n' +
		'Creates a new device profile. If a vid field is not present in the meta ' +
		'then a default device presentation will be created for this profile and the ' +
		'vid set to reference it.' +
		this.apiDocsURL('createDeviceProfile')

	static flags = {
		...APIOrganizationCommand.flags,
		...inputAndOutputItem.flags,
	}

	static examples = [
		'$ smartthings deviceprofiles:create -i myprofile.json    # create a device profile from the JSON file definition',
		'$ smartthings deviceprofiles:create -i myprofile.yaml    # create a device profile from the YAML file definition',
		'$ smartthings deviceprofiles:create                      # create a device profile with interactive dialog',
	]

	async run(): Promise<void> {
		const createDeviceProfile = async (_: void, data: DeviceDefinitionRequest): Promise<DeviceProfile> => {
			if (data.view) {
				throw new Error('Input contains "view" property. Use deviceprofiles:view:create instead.')
			}

			if (!data.metadata?.vid) {
				const profileAndConfig = await createWithDefaultConfig(this.client, data)
				return profileAndConfig.deviceProfile
			}

			return await this.client.deviceProfiles.create(cleanupForCreate(data))
		}
		await inputAndOutputItem(this,
			{ buildTableOutput: data => buildTableOutput(this.tableGenerator, data) },
			createDeviceProfile, inputProcessor(() => true, () => getInputFromUser(this)))
	}
}
