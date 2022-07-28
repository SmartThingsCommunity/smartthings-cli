import { DeviceProfile, DeviceProfileRequest, LocaleReference, PresentationDeviceConfigEntry } from '@smartthings/core-sdk'

import {
	APIOrganizationCommand,
	ChooseOptions,
	chooseOptionsWithDefaults,
	selectFromList,
	stringTranslateToId,
	summarizedText,
	TableGenerator,
} from '@smartthings/cli-lib'


export interface DeviceView {
	dashboard?: {
		states: PresentationDeviceConfigEntry[]
		actions: PresentationDeviceConfigEntry[]
	}
	detailView?: PresentationDeviceConfigEntry[]
	automation?: {
		conditions: PresentationDeviceConfigEntry[]
		actions: PresentationDeviceConfigEntry[]
	}
}

export interface DeviceDefinition extends DeviceProfile {
	view?: DeviceView
}

export interface DeviceDefinitionRequest extends DeviceProfileRequest {
	view?: DeviceView
}

export const entryValues = (entries: PresentationDeviceConfigEntry[]): string =>
	entries.map(entry => entry.component ? `${entry.component}/${entry.capability}` : `${entry.capability}`).join('\n')

export interface TableOutputOptions {
	includePreferences?: boolean
	includeViewInfo?: boolean
}

export const buildTableOutput = (tableGenerator: TableGenerator, data: DeviceProfile | DeviceDefinition,
		options?: TableOutputOptions): string => {
	const table = tableGenerator.newOutputTable()
	table.push(['Name', data.name])
	for (const comp of data.components) {
		table.push([`${comp.id} component`, comp.capabilities?.map(it => it.id).join('\n') ?? ''])
	}
	table.push(['Id', data.id])
	table.push(['Device Type', data.metadata?.deviceType ?? ''])
	table.push(['OCF Device Type', data.metadata?.ocfDeviceType ?? ''])
	table.push(['Manufacturer Name', data.metadata?.mnmn ?? ''])
	table.push(['Presentation Id', data.metadata?.vid ?? ''])
	table.push(['Status', data.status])
	if (options?.includeViewInfo && 'view' in data && data.view) {
		if (data.view.dashboard) {
			if (data.view.dashboard.states) {
				table.push(['Dashboard states', entryValues(data.view.dashboard.states)])
			}
			if (data.view.dashboard.actions) {
				table.push(['Dashboard actions', entryValues(data.view.dashboard.actions)])
			}
		}
		if (data.view.detailView) {
			table.push(['Detail view', entryValues(data.view.detailView)])
		}
		if (data.view.automation) {
			if (data.view.automation.conditions) {
				table.push(['Automation conditions', entryValues(data.view.automation.conditions)])
			}
			if (data.view.automation.actions) {
				table.push(['Automation actions', entryValues(data.view.automation.actions)])
			}
		}
	}

	if (options?.includePreferences) {
		const preferencesInfo = data.preferences?.length
			? 'Device Preferences\n' + tableGenerator.buildTableFromList(data.preferences,
				['preferenceId', 'title', 'preferenceType', 'definition.default'])
			: 'No preferences'
		return `Basic Information\n${table.toString()}\n\n` +
			`${preferencesInfo}\n\n` +
			summarizedText
	}
	return `${table.toString()}\n\n${summarizedText}`
}

export const chooseDeviceProfile = async (command: APIOrganizationCommand<typeof APIOrganizationCommand.flags>,
		deviceProfileFromArg?: string, options?: Partial<ChooseOptions>): Promise<string> => {
	const opts = chooseOptionsWithDefaults(options)
	const config = {
		itemName: 'device profile',
		primaryKeyName: 'id',
		sortKeyName: 'name',
		listTableFieldDefinitions: ['name', 'status', 'id'],
	}
	if (opts.verbose) {
		config.listTableFieldDefinitions.splice(3, 0, 'locales')
	}

	const listItems = async (): Promise<DeviceProfile[]> => {
		const deviceProfiles = await command.client.deviceProfiles.list()
		if (opts.verbose) {
			const ops = deviceProfiles.map(async (it) => {
				try {
					return await command.client.deviceProfiles.listLocales(it.id)
				} catch (error) {
					if ('message' in error && error.message.includes('status code 404')) {
						return []
					} else {
						throw error
					}
				}
			})

			const locales = await Promise.all(ops)

			return deviceProfiles.map((deviceProfile, index) => {
				return { ...deviceProfile, locales: locales[index].map((it: LocaleReference) => it.tag).sort().join(', ') }
			})
		}
		return deviceProfiles
	}

	const preselectedId = opts.allowIndex
		? await stringTranslateToId(config, deviceProfileFromArg, listItems)
		: deviceProfileFromArg
	return selectFromList(command, config, { preselectedId, listItems })
}

// Cleanup is done so that the result of a device profile get can be modified and
// used in an update operation without having to delete the status, owner, and
// component name fields, which aren't accepted in the update API call.
export const cleanupDeviceProfileRequest = (deviceProfileRequest: Partial<DeviceProfile & { restrictions: unknown }>): DeviceProfileRequest => {
	delete deviceProfileRequest.id
	delete deviceProfileRequest.status
	delete deviceProfileRequest.name
	if (deviceProfileRequest.components) {
		for (const component of deviceProfileRequest.components) {
			delete component.label
		}
	}
	delete deviceProfileRequest.restrictions

	return deviceProfileRequest
}
