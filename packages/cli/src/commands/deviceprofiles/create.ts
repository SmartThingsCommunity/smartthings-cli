import {
	DeviceProfile,
	DeviceProfileRequest, PresentationDeviceConfig,
	PresentationDeviceConfigCreate,
	SmartThingsClient,
} from '@smartthings/core-sdk'

import { InputOutputAPICommand } from '@smartthings/cli-lib'
import { buildTableOutput } from '../deviceprofiles'
import { DeviceDefinitionRequest } from './view'
import inquirer from 'inquirer'


const capabilitiesWithoutPresentations = ['healthCheck', 'execute']

export async function generateDefaultConfig(client: SmartThingsClient, deviceProfileId: string,  deviceProfile: DeviceProfileRequest | DeviceDefinitionRequest): Promise<PresentationDeviceConfigCreate> {
	// Generate the default config
	const deviceConfig = await client.presentation.generate(deviceProfileId)

	// Edit the dashboard entries to include only the first capability in the profile
	if (deviceProfile.components && deviceConfig.dashboard) {
		const firstComponent = deviceProfile.components[0]
		if (firstComponent.capabilities && firstComponent.capabilities.length > 0) {
			const firstCapability = firstComponent.capabilities[0]
			const capability = await client.capabilities.get(firstCapability.id, firstCapability.version || 1)

			if (capability.attributes && Object.keys(capability.attributes).length > 0) {
				deviceConfig.dashboard.states = deviceConfig.dashboard.states.filter(it =>
					it.component === firstComponent.id && it.capability === firstCapability.id)
			} else {
				deviceConfig.dashboard.states = []
			}

			if (capability.commands && Object.keys(capability.commands).length > 0) {
				deviceConfig.dashboard.actions = deviceConfig.dashboard.actions.filter(it =>
					it.component === firstComponent.id && it.capability === firstCapability.id)
			} else {
				deviceConfig.dashboard.actions = []
			}
		}
	}

	// Filter capabilities with no UI
	if (deviceConfig.detailView) {
		deviceConfig.detailView = deviceConfig.detailView.filter(it => !(capabilitiesWithoutPresentations.includes(it.capability)))
	}

	// Filter automation entries
	if (deviceConfig.automation) {

		// Filter out conditions for capabilities that don't have attributes
		if (deviceConfig.automation.conditions) {
			const capabilities = await Promise.all(deviceConfig.automation.conditions.map(it => {
				return client.capabilities.get(it.capability, it.version || 1)
			}))
			deviceConfig.automation.conditions = deviceConfig.automation.conditions.filter((_v, index) => {
				const capability = capabilities[index]
				return capability.attributes && Object.keys(capability.attributes).length > 0 && !(capabilitiesWithoutPresentations.includes(capability.id || ''))
			})
		}

		// Filter out automation actions for capabilities that don't have commands
		if (deviceConfig.automation.actions) {
			const capabilities = await Promise.all(deviceConfig.automation.actions.map(it => {
				return client.capabilities.get(it.capability, it.version || 1)
			}))
			deviceConfig.automation.actions = deviceConfig.automation.actions.filter((_v, index) => {
				const capability = capabilities[index]
				return capability.commands && Object.keys(capability.commands).length > 0 && !(capabilitiesWithoutPresentations.includes(capability.id || ''))
			})
		}
	}

	return deviceConfig
}

export interface  DeviceProfileAndConfig {
	deviceProfile: DeviceProfile
	deviceConfig: PresentationDeviceConfig
}

export async function createWithDefaultConfig(client: SmartThingsClient, data: DeviceDefinitionRequest): Promise<DeviceProfileAndConfig> {

	// Create the profile
	let deviceProfile = await client.deviceProfiles.create(cleanupRequest(data))

	// Generate the default config
	const deviceConfigData = await generateDefaultConfig(client, deviceProfile.id, deviceProfile)

	// Create the config using the default
	const deviceConfig = await client.presentation.create(deviceConfigData)

	// Update the profile to use the vid from the config
	const profileId = deviceProfile.id
	cleanupRequest(deviceProfile)
	delete deviceProfile.name
	if (!deviceProfile.metadata) {
		deviceProfile.metadata = {}
	}
	deviceProfile.metadata.vid = deviceConfig.vid
	deviceProfile.metadata.mnmn = deviceConfig.mnmn

	// Update the profile with the vid and mnmn
	deviceProfile = await client.deviceProfiles.update(profileId, deviceProfile)

	// Return the composite object
	return {deviceProfile, deviceConfig}
}

// Cleanup is done so that the result of a device profile get can be modified and
// used in an update operation without having to delete the status, owner, and
// component name fields, which aren't accepted in the update API call.
export function cleanupRequest(deviceProfileRequest: Partial<DeviceProfile & { restrictions: unknown }>): DeviceProfileRequest {
	delete deviceProfileRequest.id
	delete deviceProfileRequest.status
	delete deviceProfileRequest.owner
	delete deviceProfileRequest.restrictions
	if (deviceProfileRequest.components) {
		for (const component of deviceProfileRequest.components) {
			delete component.label
		}
	}
	return deviceProfileRequest
}

export default class DeviceProfileCreateCommand extends InputOutputAPICommand<DeviceDefinitionRequest, DeviceProfile> {
	static description = 'Create a new device profile\n' +
		'Creates a new device profile. If a vid field is not present in the meta\n' +
		'then a default device presentation will be created for this profile and the\n' +
		'vid set to reference it.'

	static flags = InputOutputAPICommand.flags

	static examples = [
		'$ smartthings deviceprofiles:create -i myprofile.json    # create a device profile from the JSON file definition',
		'$ smartthings deviceprofiles:create -i myprofile.yaml    # create a device profile from the YAML file definition',
		'$ smartthings deviceprofiles:create                      # create a device profile with interactive dialog',
	]

	protected buildTableOutput = buildTableOutput

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceProfileCreateCommand)
		await super.setup(args, argv, flags)

		this.processNormally(async (data) => {
			if (data.view) {
				throw new Error('Input contains "view" property. Use deviceprofiles:view:create instead.')
			}

			if (!data.metadata?.vid) {
				const profileAndConfig = await createWithDefaultConfig(this.client, data)
				return profileAndConfig.deviceProfile
			}

			return await this.client.deviceProfiles.create(cleanupRequest(data))
		})
	}

	protected async promptAndAddCapability(deviceProfile: DeviceProfileRequest, componentId: string, message = 'Capability ID'): Promise<void> {
		const capabilityId: string = (await inquirer.prompt({
			type: 'input',
			name: 'capabilityId',
			message: message + ': ',
			validate: (input) => {
				return input.length > 0 || 'Invalid capability name'
			},
		})).capabilityId

		if (capabilityId) {
			const component = deviceProfile.components?.find(it => it.id === componentId)
			if (component) {
				component.capabilities?.push({id: capabilityId, version: 1})
			} else {
				throw new Error(`Component ${componentId} not defined in profile`)
			}
		}
	}

	protected async promptAndAddComponent(deviceProfile: DeviceProfileRequest, previousComponentId: string): Promise<string> {
		const components = deviceProfile.components || []
		let componentId: string = (await inquirer.prompt({
			type: 'input',
			name: 'componentId',
			message: 'ComponentId ID: ',
			validate: (input) => {
				return (new RegExp(/^[0-9a-zA-Z]{1,100}$/).test(input) && !components.find(it => it.id === input)) || 'Invalid component name'
			},
		})).componentId

		if (componentId) {
			components.push({id: componentId, capabilities: []})
		} else {
			componentId = previousComponentId
		}
		return componentId
	}

	protected async getInputFromUser(): Promise<DeviceProfileRequest> {
		const name = (await inquirer.prompt({
			type: 'input',
			name: 'deviceProfileName',
			message: 'Device Profile Name:',
			validate: (input: string) => {
				return new RegExp(/^(?!\s)[-_!.~'() *0-9a-zA-Z]{1,100}(?<!\s)$/).test(input) ||  'Invalid device profile name'
			},
		})).deviceProfileName

		const deviceProfile: DeviceProfileRequest = {
			name,
			components: [
				{
					id: 'main',
					capabilities: [],
				},
			],
		}

		await this.promptAndAddCapability(deviceProfile, 'main', 'Primary capability ID')

		const enum Action {
			ADD_CAPABILITY = 'Add another capability to this component',
			ADD_COMPONENT = 'Add another component',
			FINISH = 'Finish & Create',
		}

		let action: string
		let componentId = 'main'
		const choices = [Action.ADD_CAPABILITY, Action.ADD_COMPONENT, Action.FINISH]
		do {
			action = (await inquirer.prompt({
				type: 'list',
				name: 'action',
				message: 'Select an action...',
				choices,
			})).action

			if (action === Action.ADD_CAPABILITY) {
				await this.promptAndAddCapability(deviceProfile, componentId)
			} else if (action === Action.ADD_COMPONENT) {
				componentId = await this.promptAndAddComponent(deviceProfile, componentId)
				await this.promptAndAddCapability(deviceProfile, componentId)
			}
		} while (action !== Action.FINISH)

		return deviceProfile
	}
}



