import { APIOrganizationCommand, inputAndOutputItem } from '@smartthings/cli-lib'

import { cleanupRequest, createWithDefaultConfig } from '../create'
import { buildTableOutput, prunePresentationValues, augmentPresentationValues, DeviceDefinition, DeviceDefinitionRequest } from '../view'


export default class DeviceDefCreateCommand extends APIOrganizationCommand {
	static description = 'create a new device profile and device configuration\n' +
		'Creates a new device profile and device configuration. Unlike deviceprofiles:create,\n' +
		'this command accepts a consolidated object that can include a device configuration\n' +
		'in a property named "view".'

	static flags = {
		...APIOrganizationCommand.flags,
		...inputAndOutputItem.flags,
	}

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

	static aliases = ['device-profiles:view:create']

	private async createWithCustomConfig(data: DeviceDefinitionRequest): Promise<DeviceDefinition> {
		if (!data.view) {
			throw Error('View property not defined')
		}

		// create the device config from the view data
		const deviceConfig = await this.client.presentation.create(augmentPresentationValues(data.view))

		// Set the vid and mnmn from the config
		if (!data.metadata) {
			data.metadata = {}
		}
		data.metadata.vid = deviceConfig.presentationId
		data.metadata.mnmn = deviceConfig.manufacturerName
		delete data.view

		// Create the profile
		const profile = await this.client.deviceProfiles.create(cleanupRequest(data))

		// Return the composite object
		return { ...profile, view: prunePresentationValues(deviceConfig) }
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceDefCreateCommand)
		await super.setup(args, argv, flags)

		const createDeviceDefinition = async (_: void, data: DeviceDefinitionRequest): Promise<DeviceDefinition> => {
			if (data.view) {
				return this.createWithCustomConfig(data)
			}
			const profileAndConfig = await createWithDefaultConfig(this.client, data)
			return { ...profileAndConfig.deviceProfile, view: prunePresentationValues(profileAndConfig.deviceConfig) }
		}
		await inputAndOutputItem(this,
			{ buildTableOutput: data => buildTableOutput(this.tableGenerator, data) },
			createDeviceDefinition)
	}
}
