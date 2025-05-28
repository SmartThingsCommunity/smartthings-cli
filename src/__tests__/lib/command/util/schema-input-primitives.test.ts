import { jest } from '@jest/globals'

import type { SchemaAppRequest } from '@smartthings/core-sdk'

import { awsHelpText } from '../../../../lib/aws-util.js'
import type {
	booleanDef,
	createFromUserInput,
	InputDefinition,
	listSelectionDef,
	objectDef,
	optionalDef,
	optionalStringDef,
	selectDef,
	staticDef,
	stringDef,
	undefinedDef,
	updateFromUserInput,
} from '../../../../lib/item-input/index.js'


const booleanDefMock = jest.fn<typeof booleanDef>()
const createFromUserInputMock = jest.fn<typeof createFromUserInput>()
const listSelectionDefMock = jest.fn<typeof listSelectionDef>()
const objectDefMock = jest.fn<typeof objectDef>()
const optionalDefMock = jest.fn<typeof optionalDef>()
const optionalStringDefMock = jest.fn<typeof optionalStringDef>()
const selectDefMock = jest.fn<typeof selectDef>()
const staticDefMock = jest.fn<typeof staticDef>()
const stringDefMock = jest.fn<typeof stringDef>()
const undefinedDefMock = {} as typeof undefinedDef
const updateFromUserInputMock = jest.fn<typeof updateFromUserInput>()
jest.unstable_mockModule('../../../../lib/item-input/index.js', () => ({
	booleanDef: booleanDefMock,
	createFromUserInput: createFromUserInputMock,
	listSelectionDef: listSelectionDefMock,
	maxItemValueLength: 16,
	objectDef: objectDefMock,
	optionalDef: optionalDefMock,
	optionalStringDef: optionalStringDefMock,
	selectDef: selectDefMock,
	staticDef: staticDefMock,
	stringDef: stringDefMock,
	undefinedDef: undefinedDefMock,
	updateFromUserInput: updateFromUserInputMock,
}))


const {
	arnDef,
	webHookUrlDef,
} = await import('../../../../lib/command/util/schema-input-primitives.js')


const generatedStringDef = { name: 'Generated String Def' } as InputDefinition<string>
const generatedARNDef = { name: 'Generated ARN Def' } as InputDefinition<string | undefined>
const lambdaInitialValue = { appName: 'Schema App', hostingType: 'lambda' } as SchemaAppRequest
const webhookInitialValue = { appName: 'Schema App', hostingType: 'webhook' } as SchemaAppRequest

describe('arnDef', () => {
	it('uses undefinedDef when in China but ARN is not for China', () => {
		expect(arnDef('ARN', true, undefined)).toBe(undefinedDefMock)
		expect(arnDef('ARN', true, undefined, { forChina: false })).toBe(undefinedDefMock)
	})

	it('uses undefinedDef when not in China but for China', () => {
		expect(arnDef('ARN', false, undefined, { forChina: true })).toBe(undefinedDefMock)
	})

	it('uses required stringDef in China', () => {
		stringDefMock.mockReturnValueOnce(generatedStringDef)
		optionalDefMock.mockReturnValueOnce(generatedARNDef)

		expect(arnDef('ARN', true, lambdaInitialValue, { forChina: true })).toBe(generatedARNDef)

		expect(stringDefMock).toHaveBeenCalledExactlyOnceWith('ARN', { helpText: awsHelpText })
		expect(optionalDefMock).toHaveBeenCalledExactlyOnceWith(
			generatedStringDef,
			expect.any(Function),
			{ initiallyActive: true },
		)

		expect(optionalStringDefMock).not.toHaveBeenCalled()
	})

	it('uses optional string def for global', () => {
		optionalStringDefMock.mockReturnValueOnce(generatedStringDef)
		optionalDefMock.mockReturnValueOnce(generatedARNDef)

		expect(arnDef('ARN', false)).toBe(generatedARNDef)

		expect(optionalStringDefMock)
			.toHaveBeenCalledExactlyOnceWith('ARN', { helpText: awsHelpText })
		expect(optionalDefMock).toHaveBeenCalledExactlyOnceWith(
			generatedStringDef,
			expect.any(Function),
			{ initiallyActive: false },
		)

		expect(stringDefMock).not.toHaveBeenCalled()
	})

	it.each`
		initialValue                  | initiallyActive
		${{ hostingType: 'lambda' }}  | ${true}
		${{ hostingType: 'webhook' }} | ${false}
		${undefined}                  | ${false}
	`('uses initiallyActive $initiallyActive for initialValue $initialValue', ({ initialValue, initiallyActive }) => {
		optionalStringDefMock.mockReturnValueOnce(generatedStringDef)
		optionalDefMock.mockReturnValueOnce(generatedARNDef)

		expect(arnDef('ARN', false, initialValue)).toBe(generatedARNDef)

		expect(optionalDefMock).toHaveBeenCalledExactlyOnceWith(generatedStringDef, expect.any(Function), { initiallyActive })
	})

	it('predicate function tests for hostingType of "lambda"', async () => {
		optionalStringDefMock.mockReturnValueOnce(generatedStringDef)
		optionalDefMock.mockReturnValueOnce(generatedARNDef)

		expect(arnDef('ARN', false, lambdaInitialValue)).toBe(generatedARNDef)

		const checkIfActiveFunction = optionalDefMock.mock.calls[0][1]

		expect(checkIfActiveFunction([{ hostingType: 'lambda' }])).toBe(true)
		expect(checkIfActiveFunction([{ hostingType: 'webhook' }])).toBe(false)
		expect(checkIfActiveFunction()).toBe(false)
	})
})

describe('webHookUrlDef', () => {
	it('uses undefinedDef when in China', () => {
		expect(webHookUrlDef(true, undefined)).toBe(undefinedDefMock)
	})

	it('uses stringDef when not in China', () => {
		stringDefMock.mockReturnValueOnce(generatedStringDef)
		optionalDefMock.mockReturnValueOnce(generatedARNDef)

		expect(webHookUrlDef(false, webhookInitialValue)).toBe(generatedARNDef)

		expect(stringDefMock).toHaveBeenCalledExactlyOnceWith('Webhook URL', { validate: expect.any(Function) })
		expect(optionalDefMock).toHaveBeenCalledExactlyOnceWith(
			generatedStringDef,
			expect.any(Function),
			{ initiallyActive: true },
		)

		expect(optionalStringDefMock).not.toHaveBeenCalled()
	})

	it.each`
		initialValue                  | initiallyActive
		${{ hostingType: 'webhook' }} | ${true}
		${{ hostingType: 'lambda' }}  | ${false}
		${undefined}                  | ${false}
	`('uses initiallyActive $initiallyActive for initialValue $initialValue', ({ initialValue, initiallyActive }) => {
		stringDefMock.mockReturnValueOnce(generatedStringDef)
		optionalDefMock.mockReturnValueOnce(generatedARNDef)

		expect(webHookUrlDef(false, initialValue)).toBe(generatedARNDef)

		expect(optionalDefMock).toHaveBeenCalledExactlyOnceWith(generatedStringDef, expect.any(Function), { initiallyActive })
	})

	it('predicate function tests for hostingType of "webhook"', async () => {
		optionalStringDefMock.mockReturnValueOnce(generatedStringDef)
		optionalDefMock.mockReturnValueOnce(generatedARNDef)

		expect(webHookUrlDef(false, webhookInitialValue)).toBe(generatedARNDef)

		const checkIfActiveFunction = optionalDefMock.mock.calls[0][1]

		expect(checkIfActiveFunction([{ hostingType: 'lambda' }])).toBe(false)
		expect(checkIfActiveFunction([{ hostingType: 'webhook' }])).toBe(true)
		expect(checkIfActiveFunction()).toBe(false)
	})
})
