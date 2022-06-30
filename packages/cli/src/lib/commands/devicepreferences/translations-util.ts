import { TableFieldDefinition } from '@smartthings/cli-lib'
import { PreferenceLocalization } from '@smartthings/core-sdk'


export const tableFieldDefinitions: TableFieldDefinition<PreferenceLocalization>[] = [
	'tag',
	'label',
	{
		prop: 'description', skipEmpty: true,
	},
	{
		prop: 'options',
		include: preferenceLocalization => !!preferenceLocalization.options,
		skipEmpty: true,
		value: preferenceLocalization => {
			return preferenceLocalization.options ?
				Object.entries(preferenceLocalization.options).map(([option, translation]) => `${option}: ${translation.label}`).join('\n') :
				undefined
		},
	},
]
