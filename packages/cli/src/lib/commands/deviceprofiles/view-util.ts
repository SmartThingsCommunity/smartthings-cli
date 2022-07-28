import { PresentationDeviceConfigEntry } from '@smartthings/core-sdk'

import { DeviceView } from '../deviceprofiles-util'


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
