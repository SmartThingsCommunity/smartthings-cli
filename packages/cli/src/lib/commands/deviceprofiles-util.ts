import {
	DeviceProfile,
	DeviceProfileCreateRequest,
	DeviceProfileRequest,
	DeviceProfileUpdateRequest,
	LocaleReference,
	PresentationDeviceConfigEntry,
} from '@smartthings/core-sdk'

import {
	APIOrganizationCommand,
	ChooseOptions,
	chooseOptionsWithDefaults,
	selectFromList,
	SelectFromListConfig,
	stringTranslateToId,
	TableGenerator,
	WithLocales,
} from '@smartthings/cli-lib'


export type ViewPresentationDeviceConfigEntry =
	Omit<PresentationDeviceConfigEntry, 'component'> & Partial<Pick<PresentationDeviceConfigEntry, 'component'>>
export type DeviceView = {
	dashboard?: {
		states: ViewPresentationDeviceConfigEntry[]
		actions: ViewPresentationDeviceConfigEntry[]
	}
	detailView?: ViewPresentationDeviceConfigEntry[]
	automation?: {
		conditions: ViewPresentationDeviceConfigEntry[]
		actions: ViewPresentationDeviceConfigEntry[]
	}
}

export type DeviceDefinition = DeviceProfile & {
	view?: DeviceView
}

export type DeviceDefinitionRequest = DeviceProfileRequest & {
	view?: DeviceView
}

export const entryValues = (entries: ViewPresentationDeviceConfigEntry[]): string =>
	entries.map(entry => entry.component ? `${entry.component}/${entry.capability}` : `${entry.capability}`).join('\n')

export type TableOutputOptions = {
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
				['preferenceId', 'title', 'preferenceType', { path: 'definition.default' }])
			: 'No preferences'
		return `Basic Information\n${table.toString()}\n\n` +
			preferencesInfo
	}
	return table.toString()
}

export const chooseDeviceProfile = async (command: APIOrganizationCommand<typeof APIOrganizationCommand.flags>,
		deviceProfileFromArg?: string, options?: Partial<ChooseOptions<DeviceProfile & WithLocales>>): Promise<string> => {
	const opts = chooseOptionsWithDefaults(options)
	const config: SelectFromListConfig<DeviceProfile & WithLocales> = {
		itemName: 'device profile',
		primaryKeyName: 'id',
		sortKeyName: 'name',
		listTableFieldDefinitions: ['name', 'status', 'id'],
	}
	if (opts.verbose) {
		config.listTableFieldDefinitions.splice(3, 0, 'locales')
	}

	const listItems = async (): Promise<(DeviceProfile & WithLocales)[]> => {
		const deviceProfiles = await command.client.deviceProfiles.list()
		if (opts.verbose) {
			const ops = deviceProfiles.map(async it => {
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

/**
 * Convert the `DeviceProfile` to a `DeviceProfileCreateRequest` by removing fields which can't
 * be included in an create request.
 */
export const cleanupForCreate = (deviceProfile: Partial<DeviceProfile & { restrictions: unknown }>): DeviceProfileCreateRequest => {
	const components = deviceProfile.components?.map(component => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { label, ...withoutLabel } = component
		return withoutLabel
	})
	const createRequest = { ...deviceProfile, components }
	delete createRequest.id
	delete createRequest.status
	delete createRequest.restrictions
	return createRequest
}

/**
 * Convert the `DeviceProfile` to a `DeviceProfileUpdateRequest` by removing fields which can't
 * be included in an update request.
 */
export const cleanupForUpdate = (deviceProfile: Partial<DeviceProfile & { restrictions: unknown }>): DeviceProfileUpdateRequest => {
	const updateRequest = cleanupForCreate(deviceProfile)
	delete updateRequest.name
	return updateRequest
}
