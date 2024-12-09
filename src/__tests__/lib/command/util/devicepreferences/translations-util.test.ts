import type { PreferenceLocalization } from '@smartthings/core-sdk'

import { ValueTableFieldDefinition } from '../../../../../lib/table-generator.js'
import {
	tableFieldDefinitions,
} from '../../../../../lib/command/util/devicepreferences/translations-util.js'


const unpopulatedOptions: (Record<string, { label: string }> | null |  undefined)[] = [
	null,
	undefined,
	{},
]

const populatedOptions: ({
	options: Record<string, { label: string }>
	expected: string
})[] = [
	{ options: { key: { label: 'Translation' } }, expected: 'key: Translation' },
	{
		options: { key1: { label: 'Translation 1' }, key2: { label: 'Translation 2' } },
		expected: 'key1: Translation 1\nkey2: Translation 2',
	},
]

const definition = tableFieldDefinitions[3] as ValueTableFieldDefinition<PreferenceLocalization>

describe('options include function', () => {
	const include = definition.include

	it.each(unpopulatedOptions)('returns false for unpopulated options', (options) => {
		expect(include?.({ options } as PreferenceLocalization)).toBeFalse()
	})

	it.each(populatedOptions)('returns true for populated options', ({ options }) => {
		expect(include?.({ options } as PreferenceLocalization)).toBeTrue()
	})
})

describe('options value function', () => {
	const value = definition.value

	it.each(unpopulatedOptions)('returns falsy for unpopulated options', (options) => {
		expect(value?.({ options } as PreferenceLocalization)).toBeFalsy()
	})

	it.each(populatedOptions)(
		'returns string representation for populated options',
		({ options, expected }) => {
			expect(value?.({ options } as PreferenceLocalization)).toBe(expected)
		},
	)
})
