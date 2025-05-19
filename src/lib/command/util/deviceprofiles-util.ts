import {
	type DeviceProfile,
	type DeviceProfileCreateRequest,
	type DeviceProfileRequest,
	type DeviceProfileUpdateRequest,
	type PresentationDeviceConfigEntry,
} from '@smartthings/core-sdk'

import { type TableGenerator } from '../../table-generator.js'


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
	entries.map(entry => entry.component
		? `${entry.component}/${entry.capability}`
		: `${entry.capability}`).join('\n')

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

/**
 * Convert the `DeviceProfile` to a `DeviceProfileCreateRequest` by removing fields which can't
 * be included in a create request.
 */
export const cleanupForCreate = (
		deviceProfile: Partial<DeviceProfile & { restrictions: unknown }>,
): DeviceProfileCreateRequest => {
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
export const cleanupForUpdate = (
		deviceProfile: Partial<DeviceProfile & { restrictions: unknown }>,
): DeviceProfileUpdateRequest => {
	const updateRequest = cleanupForCreate(deviceProfile)
	delete updateRequest.name
	return updateRequest
}
