import { InputOutputAPICommand } from '@smartthings/cli-lib'
import {cleanupRequest, generateDefaultConfig} from '../create'
import { buildTableOutput, prunePresentationValues, augmentPresentationValues, DeviceDefinition, DeviceDefinitionRequest } from '../view'


export default class DeviceDefCreateCommand extends InputOutputAPICommand<DeviceDefinitionRequest, DeviceDefinition> {
	static description = 'Create a new device profile and device configuration.\n' +
		'Creates a new device profile and device configuration. Unlike deviceprofiles:create,\n' +
		'this command accepts a consolidated object that can include a device configration \n' +
		'in a property named "view".'

	static flags = InputOutputAPICommand.flags

	static examples = [
		'$ smartthings deviceprofiles:view:create -i test.json',
		'',
		'This test.json file defines a switch that cannot be controlled by the automations builder:',
		'',
		'name: Test Switch',
		'components:',
		'  - id: main',
		'    capabilities:',
		'      - id: switch',
		'view:',
		'  dashboard:',
		'    states:',
		'      - capability: switch',
		'    actions:',
		'      - capability: switch',
		'  detailView:',
		'    - capability: switch',
		'  automation:',
		'    conditions:',
		'      - capability: switch  ',
	]

	protected buildTableOutput = buildTableOutput

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceDefCreateCommand)
		await super.setup(args, argv, flags)

		this.processNormally(async (data) => {
			let profile
			let deviceConfig
			if (data.view) {
				// Create the config
				deviceConfig = await this.client.presentation.create(augmentPresentationValues(data.view))

				// Set the vid and mnmn from the config
				if (!data.metadata) {
					data.metadata = {}
				}
				data.metadata.vid = deviceConfig.vid
				data.metadata.mnmn = deviceConfig.mnmn
				delete data.view

				profile = await this.client.deviceProfiles.create(cleanupRequest(data))
			} else {
				// Create the profile
				profile = await this.client.deviceProfiles.create(cleanupRequest(data))

				// Generate the default config
				const deviceConfigData = await generateDefaultConfig(this.client, profile.id, profile)

				// Create the config using the default
				deviceConfig = await this.client.presentation.create(deviceConfigData)

				// Update the profile to use the vid from the config
				const profileId = profile.id
				cleanupRequest(profile)
				delete profile.name
				if (!profile.metadata) {
					profile.metadata = {}
				}
				profile.metadata.vid = deviceConfig.vid
				profile.metadata.mnmn = deviceConfig.mnmn
				profile = await this.client.deviceProfiles.update(profileId, profile)
			}
			return {...profile, presentation: prunePresentationValues(deviceConfig)}
		})
	}
}
