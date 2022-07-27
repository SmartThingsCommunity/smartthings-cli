import { DeviceProfile, DeviceProfileRequest, LocaleReference } from '@smartthings/core-sdk'

import {
	APIOrganizationCommand,
	ChooseOptions,
	chooseOptionsWithDefaults,
	selectFromList,
	stringTranslateToId,
	summarizedText,
	Table,
	TableGenerator,
} from '@smartthings/cli-lib'


export const buildTableOutput = (tableGenerator: TableGenerator, data: DeviceProfile,
		basicTableHook?: (table: Table) => void): string => {
	const table = tableGenerator.newOutputTable()
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
	if (basicTableHook) {
		basicTableHook(table)
	}

	let preferencesInfo = 'No preferences'
	if (data.preferences?.length) {
		preferencesInfo = 'Device Preferences\n' + tableGenerator.buildTableFromList(data.preferences,
			['preferenceId', 'title', 'preferenceType', 'definition.default'])
	}
	return `Basic Information\n${table.toString()}\n\n` +
		`${preferencesInfo}\n\n` +
		summarizedText
}

// TODO: merge with buildTableOutput above
export function buildTableOutputWithoutPreferences(tableGenerator: TableGenerator, data: DeviceProfile): string {
	const table = tableGenerator.newOutputTable()
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
	return table.toString()
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
