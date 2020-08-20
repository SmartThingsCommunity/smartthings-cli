import { DeviceProfile, DeviceProfileRequest, PresentationDeviceConfigEntry } from '@smartthings/core-sdk'

import {
	APICommand,
	SelectingOutputAPICommand,
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

function entryValues(entries: PresentationDeviceConfigEntry[]): string {
	return entries.map(entry => entry.component ? `${entry.component}/${entry.capability}` : `${entry.capability}`).join('\n')
}

export function buildTableOutput(this: APICommand, data: DeviceDefinition): string {
	const table = this.tableGenerator.newOutputTable()
	table.push(['Name', data.name])
	for (const comp of data.components) {
		table.push([`${comp.id} component`,  comp.capabilities ? comp.capabilities.map(it => it.id).join('\n') : ''])
	}
	table.push(['Id', data.id])
	table.push(['Device Type', data.metadata?.deviceType ?? ''])
	table.push(['OCF Device Type', data.metadata?.ocfDeviceType ?? ''])
	table.push(['Manufacturer Name', data.metadata?.mnmn ?? ''])
	table.push(['Presentation ID', data.metadata?.vid ?? ''])
	table.push(['Status', data.status])
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
	return table.toString()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function prunePresentation(view: { [key: string]: any }): void {
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

function prunePresentationEntries(entries?: PresentationDeviceConfigEntry[]): void {
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
				delete entry.component
			}
		}
	}
}

export function prunePresentationValues(view: DeviceView): DeviceView {
	prunePresentation(view)
	prunePresentationEntries(view.dashboard?.states)
	prunePresentationEntries(view.dashboard?.actions)
	prunePresentationEntries(view.detailView)
	prunePresentationEntries(view.automation?.conditions)
	prunePresentationEntries(view.automation?.actions)
	return view
}

function augmentPresentationEntries(entries?: PresentationDeviceConfigEntry[]): void {
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

export function augmentPresentationValues(view: DeviceView): DeviceView {
	augmentPresentationEntries(view.dashboard?.states)
	augmentPresentationEntries(view.dashboard?.actions)
	augmentPresentationEntries(view.detailView)
	augmentPresentationEntries(view.automation?.conditions)
	augmentPresentationEntries(view.automation?.actions)
	return view
}

export default class DeviceViewCommand extends SelectingOutputAPICommand<DeviceDefinition, DeviceProfile> {
	static description = 'Show device profile and device configuration in a single, consolidated view'

	static flags = {
		...SelectingOutputAPICommand.flags,
	}

	static args = [{
		name: 'id',
		description: 'Device profile UUID or the number from list',
	}]

	primaryKeyName = 'id'
	sortKeyName = 'name'
	acceptIndexId = true

	protected buildTableOutput = buildTableOutput

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceViewCommand)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => { return this.client.deviceProfiles.list() },
			async (id) => {
				const profile = await this.client.deviceProfiles.get(id)
				if (profile.metadata) {
					try {
						const view = await this.client.presentation.get(profile.metadata.vid)
						prunePresentationValues(view)
						return {...profile, view}
					} catch (error) {
						return profile
					}
				} else {
					return profile
				}
			},
		)
	}
}
