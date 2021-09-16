import { DeviceProfile, DeviceProfileRequest, PresentationDeviceConfigEntry } from '@smartthings/core-sdk'

import { APIOrganizationCommand, ListingOutputConfig, outputListing, TableGenerator } from '@smartthings/cli-lib'

import { buildTableOutput as deviceProfileBuildTableOutput } from '../deviceprofiles'


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

export function buildTableOutput(tableGenerator: TableGenerator, data: DeviceDefinition): string {
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
				// TODO: I'm guessing component should be optional in PresentationDeviceConfigEntry
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
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

export default class DeviceProfilesViewCommand extends APIOrganizationCommand {
	static description = 'show device profile and device configuration in a single, consolidated view'

	static flags = {
		...APIOrganizationCommand.flags,
		...outputListing.flags,
	}

	static args = [{
		name: 'id',
		description: 'device profile UUID or the number from list',
	}]

	static aliases = ['device-profiles:view']

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceProfilesViewCommand)
		await super.setup(args, argv, flags)

		const config: ListingOutputConfig<DeviceDefinition, DeviceProfile> = {
			primaryKeyName: 'id',
			sortKeyName: 'name',
			buildTableOutput: data => buildTableOutput(this.tableGenerator, data),
		}

		const getDeviceProfileAndConfig = async (id: string): Promise<DeviceDefinition> => {
			const profile = await this.client.deviceProfiles.get(id)
			if (profile.metadata) {
				try {
					const view = await this.client.presentation.get(profile.metadata.vid, profile.metadata.mnmn)
					prunePresentationValues(view)
					return { ...profile, view }
				} catch (error) {
					this.logger.warn(error)
					return profile
				}
			} else {
				return profile
			}
		}
		await outputListing(this, config, args.id,
			() => this.client.deviceProfiles.list(),
			getDeviceProfileAndConfig)
	}
}
