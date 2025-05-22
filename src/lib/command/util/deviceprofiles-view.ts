import {
	type PresentationDeviceConfig,
	type PresentationDeviceConfigCreate,
	type PresentationDeviceConfigEntry,
} from '@smartthings/core-sdk'

import { type DeviceView, type ViewPresentationDeviceConfigEntry } from './deviceprofiles-util.js'


export const prunePresentationEntries = (
		entries: PresentationDeviceConfigEntry[],
): ViewPresentationDeviceConfigEntry[] => {
	const mcd = entries.find(it => it.component !== 'main')
	return entries.map(entry => {
		const viewEntry: ViewPresentationDeviceConfigEntry = { ...entry }
		if (entry.version === 1) {
			delete viewEntry.version
		}
		if (entry.values && entry.values.length === 0) {
			delete viewEntry.values
		}
		if (!entry.visibleCondition) {
			delete viewEntry.visibleCondition
		}
		if (!mcd) {
			delete viewEntry.component
		}
		return viewEntry
	})
}

/**
 * Prune the input `PresentationDeviceConfig`, removing components when there is only one named
 * "main", the version number from a capability reference if it is 1 and empty arrays.
 */
export const prunePresentation = (view: PresentationDeviceConfig): DeviceView => {
	const retVal = { ...view } as
		DeviceView & Partial<Omit<PresentationDeviceConfig, 'dashboard' | 'detailView' | 'automation'>>
	delete retVal.manufacturerName
	delete retVal.presentationId
	delete retVal.type
	if (retVal.dpInfo === null) {
		delete retVal.dpInfo
	}
	if (view.iconUrl === null) {
		delete retVal.iconUrl
	}
	if (view.dashboard) {
		const states = prunePresentationEntries(view.dashboard.states)
		const actions = prunePresentationEntries(view.dashboard.actions)
		retVal.dashboard = { states, actions }
	}
	if (view.detailView) {
		retVal.detailView = prunePresentationEntries(view.detailView)
	}
	if (view.automation) {
		const conditions = prunePresentationEntries(view.automation.conditions)
		const actions = prunePresentationEntries(view.automation.actions)
		retVal.automation = { conditions, actions }
	}
	return retVal
}

export const augmentPresentationEntries = (
		entries?: ViewPresentationDeviceConfigEntry[],
): PresentationDeviceConfigEntry[] =>
	entries?.map(entry => (
		{
			...entry,
			version: entry.version ?? 1,
			component: entry.component ?? 'main',
		} as PresentationDeviceConfigEntry),
	) ?? []

/**
 * Update the `DeviceView` to be a `PresentationDeviceConfigCreate` by ensuring all entries
 * reference a component (by filling in "main" if not present) and all capabilities have a version
 * (using 1 if none present).
 */
export const augmentPresentation = (view: DeviceView): PresentationDeviceConfigCreate => {
	const retVal = { ...view } as PresentationDeviceConfigCreate
	if (view.dashboard) {
		const states = augmentPresentationEntries(view.dashboard.states)
		const actions = augmentPresentationEntries(view.dashboard.actions)
		retVal.dashboard = { states, actions }
	}
	if (view.detailView) {
		retVal.detailView = augmentPresentationEntries(view.detailView)
	}
	if (view.automation) {
		const conditions = augmentPresentationEntries(view.automation.conditions)
		const actions = augmentPresentationEntries(view.automation.actions)
		retVal.automation = { conditions, actions }
	}
	return retVal
}
