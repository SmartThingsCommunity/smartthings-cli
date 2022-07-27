import { DeviceProfile, DeviceProfileRequest, PresentationDeviceConfigEntry } from '@smartthings/core-sdk'

import { TableGenerator } from '@smartthings/cli-lib'

import { buildTableOutput as deviceProfileBuildTableOutput } from '../deviceprofiles-util'


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

export const buildTableOutput = (tableGenerator: TableGenerator, data: DeviceDefinition): string => {
	return deviceProfileBuildTableOutput(tableGenerator, data, table => {
		if (data.view) {
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
	})
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prunePresentation = (view: { [key: string]: any }): void => {
	delete view.manufacturerName
	delete view.presentationId
	delete view.type
	if (view.dpInfo === null) {
		delete view.dpInfo
	}
	if (view.iconUrl === null) {
		delete view.iconUrl
	}
}

export const prunePresentationEntries = (entries?: PresentationDeviceConfigEntry[]): void => {
	if (entries) {
		const mcd = entries.find(it => it.component !== 'main')
		for (const entry of entries) {
			if (entry.version === 1) {
				delete entry.version
			}
			if (entry.values && entry.values.length === 0) {
				delete entry.values
			}
			if (!entry.visibleCondition) {
				delete entry.visibleCondition
			}
			if (!mcd) {
				// TODO: I'm guessing component should be optional in PresentationDeviceConfigEntry
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				delete entry.component
			}
		}
	}
}

export const prunePresentationValues = (view: DeviceView): DeviceView => {
	prunePresentation(view)
	prunePresentationEntries(view.dashboard?.states)
	prunePresentationEntries(view.dashboard?.actions)
	prunePresentationEntries(view.detailView)
	prunePresentationEntries(view.automation?.conditions)
	prunePresentationEntries(view.automation?.actions)
	return view
}

export const augmentPresentationEntries = (entries?: PresentationDeviceConfigEntry[]): void => {
	if (entries) {
		for (const entry of entries) {
			if (!entry.version) {
				entry.version = 1
			}
			if (!entry.component) {
				entry.component = 'main'
			}
		}
	}
}

export const augmentPresentationValues = (view: DeviceView): DeviceView => {
	augmentPresentationEntries(view.dashboard?.states)
	augmentPresentationEntries(view.dashboard?.actions)
	augmentPresentationEntries(view.detailView)
	augmentPresentationEntries(view.automation?.conditions)
	augmentPresentationEntries(view.automation?.actions)
	return view
}
