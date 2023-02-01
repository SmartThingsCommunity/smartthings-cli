import { Errors } from '@oclif/core'
import inquirer from 'inquirer'

import {
	DeviceProfile,
	DeviceProfileRequest,
	PresentationDeviceConfig,
	PresentationDeviceConfigCreate,
	SmartThingsClient,
} from '@smartthings/core-sdk'

import { APICommand } from '@smartthings/cli-lib'

import { CapabilityId, chooseCapabilityFiltered } from '../capabilities-util'
import { cleanupForCreate, cleanupForUpdate, DeviceDefinitionRequest } from '../deviceprofiles-util'


const capabilitiesWithoutPresentations = ['healthCheck', 'execute']

export const generateDefaultConfig = async (client: SmartThingsClient, deviceProfileId: string,
		deviceProfile: DeviceProfileRequest | DeviceDefinitionRequest): Promise<PresentationDeviceConfigCreate> => {
	// Generate the default config
	const deviceConfig = await client.presentation.generate(deviceProfileId)

	// Edit the dashboard entries to include only the first capability in the profile
	if (deviceProfile.components) {
		if (deviceConfig.dashboard) {
			const firstComponent = deviceProfile.components[0]
			if (firstComponent.capabilities && firstComponent.capabilities.length > 0) {
				const firstCapability = firstComponent.capabilities[0]
				const capability = await client.capabilities.get(firstCapability.id, firstCapability.version || 1)

				if (capability.attributes && Object.keys(capability.attributes).length > 0) {
					deviceConfig.dashboard.states = deviceConfig.dashboard.states.filter(state =>
						state.component === firstComponent.id && state.capability === firstCapability.id)
				} else {
					deviceConfig.dashboard.states = []
				}

				if (capability.commands && Object.keys(capability.commands).length > 0) {
					deviceConfig.dashboard.actions = deviceConfig.dashboard.actions.filter(action =>
						action.component === firstComponent.id && action.capability === firstCapability.id)
				} else {
					deviceConfig.dashboard.actions = []
				}
			}
		} else {
			deviceConfig.dashboard = {
				states: [],
				actions: [],
			}
		}
	}

	// Filter capabilities with no UI
	if (deviceConfig.detailView) {
		deviceConfig.detailView = deviceConfig.detailView.filter(viewItem =>
			!(capabilitiesWithoutPresentations.includes(viewItem.capability)))
	}

	// Filter automation entries
	if (deviceConfig.automation) {

		// Filter out conditions for capabilities that don't have attributes
		if (deviceConfig.automation.conditions) {
			const capabilities = await Promise.all(deviceConfig.automation.conditions.map(condition => {
				return client.capabilities.get(condition.capability, condition.version || 1)
			}))
			deviceConfig.automation.conditions = deviceConfig.automation.conditions.filter((_v, index) => {
				const capability = capabilities[index]
				return capability.attributes && Object.keys(capability.attributes).length > 0 && !(capabilitiesWithoutPresentations.includes(capability.id || ''))
			})
		}

		// Filter out automation actions for capabilities that don't have commands
		if (deviceConfig.automation.actions) {
			const capabilities = await Promise.all(deviceConfig.automation.actions.map(action => {
				return client.capabilities.get(action.capability, action.version || 1)
			}))
			deviceConfig.automation.actions = deviceConfig.automation.actions.filter((_v, index) => {
				const capability = capabilities[index]
				return capability.commands && Object.keys(capability.commands).length > 0 && !(capabilitiesWithoutPresentations.includes(capability.id || ''))
			})
		}
	}

	return deviceConfig
}

export type DeviceProfileAndConfig = {
	deviceProfile: DeviceProfile
	deviceConfig: PresentationDeviceConfig
}

export const createWithDefaultConfig = async (client: SmartThingsClient, data: DeviceDefinitionRequest): Promise<DeviceProfileAndConfig> => {
	// Create the profile
	const newProfile = await client.deviceProfiles.create(cleanupForCreate(data))

	// Generate the default config
	const deviceConfigData = await generateDefaultConfig(client, newProfile.id, newProfile)

	// Create the config using the default
	const deviceConfig = await client.presentation.create(deviceConfigData)

	// Update the profile to use the vid from the config
	const profileId = newProfile.id
	const update = cleanupForUpdate(newProfile)
	if (!update.metadata) {
		update.metadata = {}
	}
	update.metadata.vid = deviceConfig.presentationId
	update.metadata.mnmn = deviceConfig.manufacturerName

	// Update the profile with the vid and mnmn
	const deviceProfile = await client.deviceProfiles.update(profileId, update)

	// Return the composite object
	return { deviceProfile, deviceConfig }
}

// TODO - update once capability versions are supported
export const capabilityDefined = async (client: SmartThingsClient, idStr: string): Promise<boolean> => {
	try {
		const capability = await client.capabilities.get(idStr, 1)
		return !!capability
	} catch (e) {
		return false
	}
}

export const promptAndAddCapability = async (command: APICommand<typeof APICommand.flags>, deviceProfile: DeviceProfileRequest, componentId: string, prompt = 'Capability ID'): Promise<CapabilityId> => {
	let capabilityId: CapabilityId = { id: '', version: 0 }
	const idStr = (await inquirer.prompt({
		type: 'input',
		name: 'id',
		message: `${prompt} (type ? for a list):`,
		validate: async (input) => {
			return (input.endsWith('?') || input === '' || await capabilityDefined(command.client, input))
				? true
				: `Invalid ID "${input}". Please enter a valid capability ID or ? for a list of available capabilities.`
		},
	})).id

	if (idStr) {
		if (idStr.endsWith('?')) {
			capabilityId = await chooseCapabilityFiltered(command, `${prompt}:`, idStr.slice(0, idStr.length - 1))
		} else {
			// TODO - update once capability versions are supported
			capabilityId = { id: idStr, version: 1 }
		}
	}

	if (capabilityId && capabilityId.id) {
		const component = deviceProfile.components?.find(it => it.id === componentId)
		if (component) {
			component.capabilities?.push(capabilityId)
		} else {
			throw new Errors.CLIError(`Component ${componentId} not defined in profile`)
		}
	}

	return capabilityId
}

export const promptAndAddComponent = async (deviceProfile: DeviceProfileRequest, previousComponentId: string): Promise<string> => {
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
		components.push({ id: componentId, capabilities: [] })
	} else {
		componentId = previousComponentId
	}
	return componentId
}

export const getInputFromUser = async (command: APICommand<typeof APICommand.flags>): Promise<DeviceProfileRequest> => {
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

	let primaryCapabilityId: CapabilityId
	do {
		primaryCapabilityId = await promptAndAddCapability(command, deviceProfile, 'main', 'Primary capability ID')
	} while (!primaryCapabilityId.id)

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
			await promptAndAddCapability(command, deviceProfile, componentId)
		} else if (action === Action.ADD_COMPONENT) {
			componentId = await promptAndAddComponent(deviceProfile, componentId)
			await promptAndAddCapability(command, deviceProfile, componentId)
		}
	} while (action !== Action.FINISH)

	return deviceProfile
}
