import { jest } from '@jest/globals'

import type { SmartAppResponse } from '@smartthings/core-sdk'

import type {
	PropertyTableFieldDefinition,
	TableGenerator,
	ValueTableFieldDefinition,
} from '../../../../lib/table-generator.js'
import {
	mockedTableOutput,
	tableMock,
	tablePushMock,
	tableToStringMock,
} from '../../../test-lib/table-mock.js'


const {
	buildTableOutput,
	hasSubscription,
	isAPIOnlySmartApp,
	isWebhookSmartApp,
	tableFieldDefinitions,
} = await import('../../../../lib/command/util/smartapps-table.js')


test.each`
	input                             | expected
	${{}}                             | ${false}
	${{ webhookSmartApp: undefined }} | ${false}
	${{ webhookSmartApp: {} }}        | ${true}
`('isWebhookSmartApp returns $expected for $input', ({ input, expected }) => {
	expect(isWebhookSmartApp(input)).toBe(expected)
})

test.each`
	input                             | expected
	${{}}                     | ${false}
	${{ apiOnly: undefined }} | ${false}
	${{ apiOnly: {} }}        | ${true}
`('isAPIOnlySmartApp returns $expected for $input', ({ input, expected }) => {
	expect(isAPIOnlySmartApp(input)).toBe(expected)
})

test.each`
	input                                       | expected
	${{}}                                       | ${false}
	${{ apiOnly: undefined }}                   | ${false}
	${{ apiOnly: {} }}                          | ${false}
	${{ apiOnly: { subscription: undefined } }} | ${false}
	${{ apiOnly: { subscription: {} } }}        | ${true}
`('certified include returns $expected for $input', ({ input, expected }) => {
	expect(hasSubscription(input)).toBe(expected)
})

describe('tableFieldDefinitions functions', () => {
	test.each`
		input                             | expected
		${{}}                             | ${false}
		${{ classifications: undefined }} | ${false}
		${{ classifications: [] }}        | ${true}
	`('classifications include returns $expected for $input', ({ input, expected }) => {
		const include = (tableFieldDefinitions[4] as PropertyTableFieldDefinition<SmartAppResponse>).include as (input: SmartAppResponse) => boolean
		expect(include(input)).toBe(expected)
	})

	test.each`
		input                                            | expected
		${{}}                                            | ${false}
		${{ installMetadata: undefined }}                | ${false}
		${{ installMetadata: {} }}                       | ${false}
		${{ installMetadata: { certified: undefined } }} | ${false}
		${{ installMetadata: { certified: true } }}      | ${true}
	`('certified include returns $expected for $input', ({ input, expected }) => {
		const include = (tableFieldDefinitions[5] as PropertyTableFieldDefinition<SmartAppResponse>).include as (input: SmartAppResponse) => boolean
		expect(include(input)).toBe(expected)
	})

	test.each`
		input                                              | expected
		${{}}                                              | ${false}
		${{ installMetadata: undefined }}                  | ${false}
		${{ installMetadata: {} }}                         | ${false}
		${{ installMetadata: { maxInstalls: undefined } }} | ${false}
		${{ installMetadata: { maxInstalls: true } }}      | ${true}
	`('maxInstalls include returns $expected for $input', ({ input, expected }) => {
		const include = (tableFieldDefinitions[6] as PropertyTableFieldDefinition<SmartAppResponse>).include as (input: SmartAppResponse) => boolean
		expect(include(input)).toBe(expected)
	})

	test.each`
		input                                            | expected
		${{}}                                            | ${false}
		${{ webhookSmartApp: undefined }}                | ${false}
		${{ webhookSmartApp: {} }}                       | ${false}
		${{ webhookSmartApp: { publicKey: undefined } }} | ${false}
		${{ webhookSmartApp: { publicKey: 'key' } }}     | ${true}
	`('Public Key include returns $expected for $input', ({ input, expected }) => {
		const include = (tableFieldDefinitions[11] as ValueTableFieldDefinition<SmartAppResponse>).include as (input: SmartAppResponse) => boolean
		expect(include(input)).toBe(expected)
	})

	test.each`
		input                                                          | expected
		${{}}                                                          | ${''}
		${{ webhookSmartApp: {} }}                                     | ${''}
		${{ webhookSmartApp: { publicKey: 'key' } }}                   | ${'key'}
		${{ webhookSmartApp: { publicKey: 'key\r\npart2\r\npart3' } }} | ${'key\npart2\npart3'}
	`('Public Key value returns $expected for $input', ({ input, expected }) => {
		const value = (tableFieldDefinitions[11] as ValueTableFieldDefinition<SmartAppResponse>).value as (input: SmartAppResponse) => string
		expect(value(input)).toBe(expected)
	})

	test.each`
		input                                           | expected
		${{}}                                           | ${false}
		${{ lambdaSmartApp: undefined }}                | ${false}
		${{ lambdaSmartApp: {} }}                       | ${false}
		${{ lambdaSmartApp: { functions: undefined } }} | ${false}
		${{ lambdaSmartApp: { functions: [] } }}        | ${true}
	`('Lambda Function include returns $expected for $input', ({ input, expected }) => {
		const include = (tableFieldDefinitions[12] as ValueTableFieldDefinition<SmartAppResponse>).include as (input: SmartAppResponse) => boolean
		expect(include(input)).toBe(expected)
	})

	test.each`
		input                                                  | expected
		${{}}                                                  | ${''}
		${{ lambdaSmartApp: {} }}                              | ${''}
		${{ lambdaSmartApp: { functions: ['fun1'] } }}         | ${'fun1'}
		${{ lambdaSmartApp: { functions: ['fun1', 'fun2'] } }} | ${'fun1\nfun2'}
	`('Lambda Function value returns $expected for $input', ({ input, expected }) => {
		const value = (tableFieldDefinitions[12] as ValueTableFieldDefinition<SmartAppResponse>).value as (input: SmartAppResponse) => string
		expect(value(input)).toBe(expected)
	})
})

describe('buildTableOutput', () => {
	const newOutputTableMock = jest.fn<TableGenerator['newOutputTable']>()
	const mockTableGenerator = {
		newOutputTable: newOutputTableMock,
	} as unknown as TableGenerator
	it('returns simple string when app settings are not present', () => {
		expect(buildTableOutput(mockTableGenerator, { settings: {} })).toBe('No application settings.')
	})

	it('creates new table with correct options and adds settings', () => {
		newOutputTableMock.mockReturnValueOnce(tableMock)

		expect(buildTableOutput(mockTableGenerator, { settings: { setting: 'setting value' } }))
			.toBe(mockedTableOutput)
		expect(newOutputTableMock).toHaveBeenCalledWith(
			expect.objectContaining({ head: ['Key', 'Value'] }),
		)
		expect(tablePushMock).toHaveBeenCalledExactlyOnceWith(['setting', 'setting value'])
		expect(tableToStringMock).toHaveBeenCalledExactlyOnceWith()
	})
})
