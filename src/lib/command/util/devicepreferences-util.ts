import { DevicePreference } from '@smartthings/core-sdk'

import { TableFieldDefinition } from '../../table-generator.js'
import { APICommand } from '../api-command.js'
import { SelectFromListConfig, SelectFromListFlags, selectFromList } from '../select.js'


export const tableFieldDefinitions: TableFieldDefinition<DevicePreference>[] = [
	'preferenceId', 'title', 'name', 'description', 'required', 'preferenceType',
	{ path: 'definition.default', skipEmpty: true },
	{ path: 'definition.minimum', skipEmpty: true },
	{ path: 'definition.maximum', skipEmpty: true },
	{ path: 'definition.minLength', skipEmpty: true },
	{ path: 'definition.maxLength', skipEmpty: true },
	{ path: 'definition.stringType', skipEmpty: true },
	{
		path: 'definition.options',
		skipEmpty: true,
		value: (pref: DevicePreference): string | undefined => {
			if (pref.preferenceType !== 'enumeration') {
				return undefined
			}
			return Object.entries(pref.definition.options).map(([key, value]) => `${key}: ${value}`).join('\n')
		},
	},
]

export const chooseDevicePreference = async (command: APICommand<SelectFromListFlags>, preselectedId?: string): Promise<string> => {
	const config: SelectFromListConfig<DevicePreference> = {
		itemName: 'device preference',
		primaryKeyName: 'preferenceId',
		sortKeyName: 'preferenceId',
		listTableFieldDefinitions: ['preferenceId', 'title', 'name'],
	}
	return selectFromList(command, config, {
		preselectedId,
		listItems: () => command.client.devicePreferences.list(),
	})
}
