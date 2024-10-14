import { PreferenceLocalization } from '@smartthings/core-sdk'

import { TableFieldDefinition } from '../../../table-generator.js'


export const tableFieldDefinitions: TableFieldDefinition<PreferenceLocalization>[] = [
	'tag',
	'label',
	{
		prop: 'description', skipEmpty: true,
	},
	{
		prop: 'options',
		include: preferenceLocalization =>
			Object.keys((preferenceLocalization.options ?? {})).length > 0,
		skipEmpty: true,
		value: (preferenceLocalization: PreferenceLocalization): string | undefined =>
			preferenceLocalization.options
				? Object.entries(preferenceLocalization.options).map(([option, translation]) =>
					`${option}: ${translation.label}`).join('\n')
				: undefined,
	},
]
