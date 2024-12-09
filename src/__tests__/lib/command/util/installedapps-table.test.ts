import { type InstalledApp, InstalledAppClassification } from '@smartthings/core-sdk'

import type { ValueTableFieldDefinition } from '../../../../lib/table-generator.js'
import { tableFieldDefinitions } from '../../../../lib/command/util/installedapps-table.js'


describe('tableFieldDefinitions classifications', () => {
	const definition = tableFieldDefinitions[8] as ValueTableFieldDefinition<InstalledApp>

	const classificationExpectations: ({
		classifications?: InstalledAppClassification[]
		expectedValue: string
		expectedInclude: boolean
	})[] = [
		{ classifications: undefined, expectedValue: '', expectedInclude: false },
		{ classifications: [], expectedValue: '', expectedInclude: true },
		{
			classifications: [InstalledAppClassification.AUTOMATION],
			expectedValue: 'AUTOMATION',
			expectedInclude: true,
		},
		{
			classifications: [InstalledAppClassification.DEVICE, InstalledAppClassification.SERVICE],
			expectedValue: 'DEVICE\nSERVICE',
			expectedInclude: true,
		},
	]

	test.each(classificationExpectations)('value returns "$expectedValue" for $classifications', (
			{ classifications, expectedValue },
	) => {
		const value = definition.value

		expect(value?.({ classifications } as InstalledApp)).toBe(expectedValue)
	})

	test.each(classificationExpectations)('include returns "$expectedValue" for $classifications', (
			{ classifications, expectedInclude },
	) => {
		const include = definition.include

		expect(include?.({ classifications } as InstalledApp)).toBe(expectedInclude)
	})
})
