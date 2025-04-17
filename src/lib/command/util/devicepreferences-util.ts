import { type DevicePreference } from '@smartthings/core-sdk'

import { type TableFieldDefinition } from '../../table-generator.js'
import { type ChooseFunction, createChooseFn } from './util-util.js'


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

export const chooseDevicePreferenceFn = (): ChooseFunction<DevicePreference> => createChooseFn(
	{
		itemName: 'device preference',
		primaryKeyName: 'preferenceId',
		sortKeyName: 'preferenceId',
		listTableFieldDefinitions: ['preferenceId', 'title', 'name'],
	},
	command => command.client.devicePreferences.list(),
)

export const chooseDevicePreference = chooseDevicePreferenceFn()
