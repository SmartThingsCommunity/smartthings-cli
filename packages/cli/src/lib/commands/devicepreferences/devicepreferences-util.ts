import { APICommand, selectFromList, TableFieldDefinition } from '@smartthings/cli-lib'
import { DevicePreference } from '@smartthings/core-sdk'


export const tableFieldDefinitions: TableFieldDefinition<DevicePreference>[] = [
	'preferenceId', 'title', 'name', 'description', 'required', 'preferenceType',
	{ prop: 'definition.default', skipEmpty: true },
	{ prop: 'definition.minimum', skipEmpty: true },
	{ prop: 'definition.maximum', skipEmpty: true },
	{ prop: 'definition.minLength', skipEmpty: true },
	{ prop: 'definition.maxLength', skipEmpty: true },
	{ prop: 'definition.stringType', skipEmpty: true },
	{
		prop: 'definition.options',
		skipEmpty: true,
		value: (pref: DevicePreference) => {
			if (pref.preferenceType !== 'enumeration') {
				return undefined
			}
			return Object.entries(pref.definition.options).map(([key, value]) => `${key}: ${value}`).join('\n')
		},
	},
]

export async function chooseDevicePreference(command: APICommand, preferenceFromArg?: string): Promise<string> {
	const config = {
		itemName: 'device preference',
		primaryKeyName: 'preferenceId',
		sortKeyName: 'preferenceId',
		listTableFieldDefinitions: ['preferenceId', 'title', 'name'],
	}
	return selectFromList(command, config, preferenceFromArg, () => command.client.devicePreferences.list())
}
