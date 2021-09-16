import { ActionFunction, APIOrganizationCommand, inputAndOutputItem } from '@smartthings/cli-lib'

import { generateDefaultConfig } from '../create'
import { cleanupRequest } from '../update'
import { augmentPresentationValues, buildTableOutput, DeviceDefinition, DeviceDefinitionRequest, prunePresentationValues } from '../view'
import { chooseDeviceProfile } from '../../deviceprofiles'


export default class DeviceProfilesViewUpdateCommand extends APIOrganizationCommand {
	static description = 'update a device profile and configuration\n' +
		'Updates a device profile and device configuration and sets the vid of the profile\n' +
		'to the vid of the updated configuration. Unlike deviceprofiles:update this\n' +
		'command accepts a consolidated object that can include a device configuration\n' +
		'in a property named "view".'

	static examples = [
		'$ smartthings deviceprofiles:view:update 84042863-0d34-4c5c-b497-808daf230787 -i test.json',
		'',
		'This test.json file adds the powerMeter capability to the device and makes it available in',
		'the device detail view but not the rule builder:',
		'',
		'components:',
		'  - id: main',
		'    capabilities:',
		'      - id: switch',
		'      - id: powerMeter',
		'view:',
		'  dashboard:',
		'    states:',
		'      - capability: switch',
		'    actions:',
		'      - capability: switch',
		'  detailView:',
		'    - capability: switch',
		'    - capability: powerMeter',
		'  automation:',
		'    conditions:',
		'      - capability: switch  ',
	]

	static flags = {
		...APIOrganizationCommand.flags,
		...inputAndOutputItem.flags,
	}

	static args = [{
		name: 'id',
		description: 'device profile id',
	}]

	static aliases = ['device-profiles:view:update']

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceProfilesViewUpdateCommand)
		await super.setup(args, argv, flags)

		const id = await chooseDeviceProfile(this, args.id)
		const executeUpdate: ActionFunction<void, DeviceDefinitionRequest, DeviceDefinition> = async (_, data) => {
			const profileData = { ...data }
			let presentationData = data.view
			delete profileData.view

			if (presentationData) {
				presentationData = augmentPresentationValues(presentationData)
			} else {
				presentationData = await generateDefaultConfig(this.client, id, profileData)
			}

			const presentation = await this.client.presentation.create(presentationData)
			if (!profileData.metadata) {
				profileData.metadata = {}
			}
			profileData.metadata.vid = presentation.presentationId
			profileData.metadata.mnmn = presentation.manufacturerName
			const profile = await this.client.deviceProfiles.update(id, cleanupRequest(profileData))

			return { ...profile, presentation: prunePresentationValues(presentation) }
		}
		await inputAndOutputItem(this, { buildTableOutput: data => buildTableOutput(this.tableGenerator, data) }, executeUpdate)
	}
}
