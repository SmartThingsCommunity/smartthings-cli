import { SchemaApp, SchemaAppRequest, SmartThingsClient, ViperAppLinks } from '@smartthings/core-sdk'

import {
	APICommand,
	chooseOptionsWithDefaults,
	clipToMaximum,
	createFromUserInput,
	DefaultValueFunction,
	InputDefinition,
	listSelectionDef,
	maxItemValueLength,
	objectDef,
	optionalDef,
	optionalStringDef,
	selectFromList,
	SmartThingsCommandInterface,
	staticDef,
	stringDef,
	stringTranslateToId,
	undefinedDef,
	updateFromUserInput,
} from '@smartthings/cli-lib'

import { awsHelpText } from '../../../lib/aws-utils'
import {
	appLinksDefSummarize,
	arnDef,
	buildInputDefinition,
	chooseSchemaApp,
	getSchemaAppCreateFromUser,
	getSchemaAppUpdateFromUser,
	InputData,
	validateFinal,
	webHookUrlDef,
} from '../../../lib/commands/schema-util'
import * as schemaUtil from '../../../lib/commands/schema-util'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		chooseOptionsWithDefaults: jest.fn(),
		clipToMaximum: jest.fn(),
		listSelectionDef: jest.fn(),
		objectDef: jest.fn(),
		optionalDef: jest.fn(),
		optionalStringDef: jest.fn(),
		selectFromList: jest.fn(),
		staticDef: jest.fn(),
		stringDef: jest.fn(),
		stringTranslateToId: jest.fn(),
		createFromUserInput: jest.fn(),
		updateFromUserInput: jest.fn(),
	}
})


const listSelectionDefMock = jest.mocked(listSelectionDef)
const optionalStringDefMock = jest.mocked(optionalStringDef)
const optionalDefMock = jest.mocked(optionalDef)
const objectDefMock = jest.mocked(objectDef)
const staticDefMock = jest.mocked(staticDef)
const stringDefMock = jest.mocked(stringDef)

const generatedStringDef = { name: 'Generated String Def' } as InputDefinition<string>
const lambdaInitialValue = { appName: 'Schema App', hostingType: 'lambda' } as SchemaAppRequest
const webhookInitialValue = { appName: 'Schema App', hostingType: 'webhook' } as SchemaAppRequest
const commandMock = { profile: {} } as unknown as SmartThingsCommandInterface

describe('arnDef', () => {
	const generatedARNDef = { name: 'Generated ARN Def' } as InputDefinition<string | undefined>

	it('uses undefinedDef when in China but ARN is not for China', () => {
		expect(arnDef('ARN', true, undefined)).toBe(undefinedDef)
		expect(arnDef('ARN', true, undefined, { forChina: false })).toBe(undefinedDef)
	})

	it('uses undefinedDef when not in China but for China', () => {
		expect(arnDef('ARN', false, undefined, { forChina: true })).toBe(undefinedDef)
	})

	it('uses required stringDef in China', () => {
		stringDefMock.mockReturnValueOnce(generatedStringDef)
		optionalDefMock.mockReturnValueOnce(generatedARNDef)

		expect(arnDef('ARN', true, lambdaInitialValue, { forChina: true })).toBe(generatedARNDef)

		expect(stringDefMock).toHaveBeenCalledTimes(1)
		expect(stringDefMock).toHaveBeenCalledWith('ARN', { helpText: awsHelpText })
		expect(optionalDefMock).toHaveBeenCalledTimes(1)
		expect(optionalDefMock).toHaveBeenCalledWith(generatedStringDef, expect.any(Function), { initiallyActive: true })

		expect(optionalStringDef).toHaveBeenCalledTimes(0)
	})

	it('uses optional string def for global', () => {
		optionalStringDefMock.mockReturnValueOnce(generatedStringDef)
		optionalDefMock.mockReturnValueOnce(generatedARNDef)

		expect(arnDef('ARN', false)).toBe(generatedARNDef)

		expect(optionalStringDef).toHaveBeenCalledTimes(1)
		expect(optionalStringDef).toHaveBeenCalledWith('ARN', { helpText: awsHelpText })
		expect(optionalDefMock).toHaveBeenCalledTimes(1)
		expect(optionalDefMock).toHaveBeenCalledWith(generatedStringDef, expect.any(Function), { initiallyActive: false })

		expect(stringDefMock).toHaveBeenCalledTimes(0)
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

		expect(optionalDefMock).toHaveBeenCalledTimes(1)
		expect(optionalDefMock).toHaveBeenLastCalledWith(generatedStringDef, expect.any(Function), { initiallyActive })
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
	const generatedARNDef = { name: 'Generated ARN Def' } as InputDefinition<string | undefined>

	it('uses undefinedDef when in China', () => {
		expect(webHookUrlDef(true, undefined)).toBe(undefinedDef)
	})

	it('uses stringDef when not in China', () => {
		stringDefMock.mockReturnValueOnce(generatedStringDef)
		optionalDefMock.mockReturnValueOnce(generatedARNDef)

		expect(webHookUrlDef(false, webhookInitialValue)).toBe(generatedARNDef)

		expect(stringDefMock).toHaveBeenCalledTimes(1)
		expect(stringDefMock).toHaveBeenCalledWith('Webhook URL')
		expect(optionalDefMock).toHaveBeenCalledTimes(1)
		expect(optionalDefMock).toHaveBeenCalledWith(generatedStringDef, expect.any(Function), { initiallyActive: true })

		expect(optionalStringDef).toHaveBeenCalledTimes(0)
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

		expect(optionalDefMock).toHaveBeenCalledTimes(1)
		expect(optionalDefMock).toHaveBeenLastCalledWith(generatedStringDef, expect.any(Function), { initiallyActive })
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

describe('validateFinal', () => {
	it('returns true if hosting type is not "lambda"', () => {
		expect(validateFinal({ hostingType: 'webhook' } as InputData)).toBe(true)
	})

	it('returns true if any ARN is set', () => {
		expect(validateFinal({ hostingType: 'lambda', lambdaArn: 'arn' } as InputData)).toBe(true)
		expect(validateFinal({ hostingType: 'lambda', lambdaArnEU: 'arn' } as InputData)).toBe(true)
		expect(validateFinal({ hostingType: 'lambda', lambdaArnAP: 'arn' } as InputData)).toBe(true)
		expect(validateFinal({ hostingType: 'lambda', lambdaArnCN: 'arn' } as InputData)).toBe(true)
	})

	it('returns error message if no ARN is set', () => {
		expect(validateFinal({ hostingType: 'lambda' } as InputData))
			.toBe('At least one lambda ARN is required.')
	})
})

test.each`
	input                                           | result
	${undefined}                                    | ${'android: undefined, ios: undefined'}
	${{}}                                           | ${'android: undefined, ios: undefined'}
	${{ android: 'android-link', ios: 'ios-link' }} | ${'android: android-link, ios: ios-link'}
`('appLinksDefSummarize generates $result from $inputJSON', ({ input, result }) => {
	const clipToMaximumMock = jest.mocked(clipToMaximum).mockReturnValue('clipped result')

	expect(appLinksDefSummarize(input)).toBe('clipped result')
	expect(clipToMaximumMock).toHaveBeenLastCalledWith(result, maxItemValueLength)
})

describe('buildInputDefinition', () => {
	const mockARNInputDef = {} as InputDefinition<string | undefined>
	const mockWebHookUrlDef = {} as InputDefinition<string | undefined>
	const chinaCommandMock = { profile: { clientIdProvider: { baseURL: 'base-url.cn' } } } as unknown as SmartThingsCommandInterface
	const appLinksDefMock = { name: 'Generated App Links Def' } as InputDefinition<ViperAppLinks>
	const generatedDef = { name: 'Final Generated Def' } as InputDefinition<InputData>

	beforeEach(() => {
		objectDefMock.mockReturnValueOnce(appLinksDefMock)
		objectDefMock.mockReturnValueOnce(generatedDef)
	})

	afterEach(() => jest.clearAllMocks())

	it('includes choice of webhook or lambda for global', () => {
		expect(buildInputDefinition(commandMock)).toBe(generatedDef)

		expect(staticDefMock).toHaveBeenCalledTimes(2)
		expect(listSelectionDef).toHaveBeenCalledTimes(1)
		expect(listSelectionDef).toHaveBeenCalledWith('Hosting Type', ['lambda', 'webhook'], { default: 'webhook' })
	})

	it('skips webhook for China', () => {
		expect(buildInputDefinition(chinaCommandMock)).toBe(generatedDef)

		expect(staticDefMock).toHaveBeenCalledTimes(3)
		expect(staticDefMock).toHaveBeenCalledWith('lambda')
		expect(listSelectionDefMock).toHaveBeenCalledTimes(0)
	})

	it('defaults appName to partnerName', () => {
		expect(buildInputDefinition(commandMock)).toBe(generatedDef)

		const defaultFunction = optionalStringDefMock.mock.calls[0][1]?.default as DefaultValueFunction<string>
		expect(defaultFunction).toBeDefined()

		expect(defaultFunction()).toBe('')
		expect(defaultFunction([])).toBe('')
		expect(defaultFunction([{}])).toBe('')
		expect(defaultFunction([{ partnerName: 'Partner Name' }])).toBe('Partner Name')
	})

	it('uses global ARN fields for global', () => {
		const arnDefSpy = jest.spyOn(schemaUtil, 'arnDef').mockImplementation(() => mockARNInputDef)
		const commandMock = { profile: { clientIdProvider: { baseURL: 'api.smartthings.com' } } } as unknown as SmartThingsCommandInterface

		expect(buildInputDefinition(commandMock)).toBe(generatedDef)

		expect(arnDefSpy).toHaveBeenCalledTimes(4)
		expect(arnDefSpy).toHaveBeenCalledWith('Lambda ARN for US region', false, undefined)
		expect(arnDefSpy).toHaveBeenCalledWith('Lambda ARN for EU region', false, undefined)
		expect(arnDefSpy).toHaveBeenCalledWith('Lambda ARN for AP region', false, undefined)
		expect(arnDefSpy).toHaveBeenCalledWith('Lambda ARN for CN region', false, undefined, { forChina: true })
	})

	it('uses lambdaArnCN fields for China', () => {
		const arnDefSpy = jest.spyOn(schemaUtil, 'arnDef').mockImplementation(() => mockARNInputDef)

		expect(buildInputDefinition(chinaCommandMock, lambdaInitialValue)).toBe(generatedDef)

		expect(arnDefSpy).toHaveBeenCalledTimes(4)
		expect(arnDefSpy).toHaveBeenCalledWith('Lambda ARN for US region', true, lambdaInitialValue)
		expect(arnDefSpy).toHaveBeenCalledWith('Lambda ARN for EU region', true, lambdaInitialValue)
		expect(arnDefSpy).toHaveBeenCalledWith('Lambda ARN for AP region', true, lambdaInitialValue)
		expect(arnDefSpy).toHaveBeenCalledWith('Lambda ARN for CN region', true, lambdaInitialValue, { forChina: true })
	})

	it('provides for app links when selected', () => {
		// Spy on this function just to reduce calls to optionalDef, making it easier to isolate the one we are testing.
		jest.spyOn(schemaUtil, 'arnDef').mockImplementation(() => mockARNInputDef)

		expect(buildInputDefinition(commandMock)).toBe(generatedDef)

		expect(optionalDefMock).toHaveBeenCalledTimes(2)
		expect(optionalDefMock).toHaveBeenCalledWith(appLinksDefMock, expect.any(Function), { initiallyActive: false })

		// First call is in webhookUrlDef; we've skipped calls in arnDef by spying on it above
		const isActiveFunction = optionalDefMock.mock.calls[1][1]
		expect(isActiveFunction).toBeDefined()

		expect(isActiveFunction()).toBe(undefined)
		expect(isActiveFunction([])).toBe(undefined)
		expect(isActiveFunction([{}])).toBe(undefined)
		expect(isActiveFunction([{ includeAppLinks: true }])).toBe(true)
		expect(isActiveFunction([{ includeAppLinks: false }])).toBe(false)
	})

	it('starts out with viperAppLinks initiallyActive set to false when initialValue has links', () => {
		// Spy on this function just to reduce calls to optionalDef, making it easier to isolate the one we are testing.
		jest.spyOn(schemaUtil, 'arnDef').mockImplementation(() => mockARNInputDef)

		expect(buildInputDefinition(commandMock, { viperAppLinks: undefined } as SchemaAppRequest)).toBe(generatedDef)

		expect(optionalDefMock).toHaveBeenCalledTimes(2)
		expect(optionalDefMock).toHaveBeenCalledWith(appLinksDefMock, expect.any(Function), { initiallyActive: false })
	})

	it('starts out with viperAppLinks initiallyActive set to true when initialValue has links', () => {
		// Spy on this function just to reduce calls to optionalDef, making it easier to isolate the one we are testing.
		jest.spyOn(schemaUtil, 'arnDef').mockImplementation(() => mockARNInputDef)

		expect(buildInputDefinition(commandMock, { viperAppLinks: {} } as SchemaAppRequest)).toBe(generatedDef)

		expect(optionalDefMock).toHaveBeenCalledTimes(2)
		expect(optionalDefMock).toHaveBeenCalledWith(appLinksDefMock, expect.any(Function), { initiallyActive: true })
	})

	it('passes initial value on to webHookUrlDef', async () => {
		const webHookUrlDefSpy = jest.spyOn(schemaUtil, 'webHookUrlDef').mockImplementation(() => mockWebHookUrlDef)

		const initialValue = { appName: 'My Schema App' } as SchemaAppRequest
		expect(buildInputDefinition(commandMock, initialValue)).toBe(generatedDef)

		expect(webHookUrlDefSpy).toHaveBeenCalledTimes(1)
		expect(webHookUrlDefSpy).toHaveBeenCalledWith(false, initialValue)
	})
})

test('getSchemaAppUpdateFromUser', async () => {
	const generatedDef = { name: 'Final Generated Def' } as InputDefinition<InputData>
	jest.spyOn(schemaUtil, 'buildInputDefinition').mockImplementation(() => generatedDef)
	const updateFromUserInputMock = jest.mocked(updateFromUserInput).mockResolvedValueOnce({
		appName: 'User-updated App Name',
		includeAppLinks: true,
	})
	const original = { appName: 'Original Schema App' } as SchemaApp

	expect(await getSchemaAppUpdateFromUser(commandMock, original, true)).toStrictEqual({
		appName: 'User-updated App Name',
	})

	expect(buildInputDefinition).toHaveBeenCalledTimes(1)
	expect(buildInputDefinition).toHaveBeenCalledWith(commandMock, original)
	expect(updateFromUserInputMock).toHaveBeenCalledTimes(1)
	expect(updateFromUserInputMock).toHaveBeenCalledWith(commandMock,
		generatedDef,
		{ ...original, includeAppLinks: false },
		{ dryRun: true })
})

test('getSchemaAppCreateFromUser', async () => {
	const generatedDef = { name: 'Final Generated Def' } as InputDefinition<InputData>
	jest.spyOn(schemaUtil, 'buildInputDefinition').mockImplementation(() => generatedDef)
	const createFromUserInputMock = jest.mocked(createFromUserInput).mockResolvedValueOnce({
		appName: 'User-updated App Name',
		includeAppLinks: false,
	})

	expect(await getSchemaAppCreateFromUser(commandMock, false)).toStrictEqual({
		appName: 'User-updated App Name',
	})

	expect(buildInputDefinition).toHaveBeenCalledTimes(1)
	expect(buildInputDefinition).toHaveBeenCalledWith(commandMock)
	expect(createFromUserInputMock).toHaveBeenCalledTimes(1)
	expect(createFromUserInputMock).toHaveBeenCalledWith(commandMock,
		generatedDef,
		{ dryRun: false })
})

describe('chooseSchemaApp', () => {
	const chooseOptionsDefaults = {
		allowIndex: false,
		verbose: false,
		useConfigDefault: false,
	}

	const schemaListMock = jest.fn()
	const client = {
		schema: {
			list: schemaListMock,
		},
	} as unknown as SmartThingsClient
	const command = { client } as APICommand<typeof APICommand.flags>

	const chooseOptionsWithDefaultsMock = jest.mocked(chooseOptionsWithDefaults).mockReturnValue(chooseOptionsDefaults)
	const selectFromListMock = jest.mocked(selectFromList).mockResolvedValue('chosen-app-id')
	const stringTranslateToIdMock = jest.mocked(stringTranslateToId).mockResolvedValue('translated-id')

	it('does not translate index id by default', async () => {
		expect(await chooseSchemaApp(command)).toBe('chosen-app-id')

		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledTimes(1)
		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledWith(undefined)
		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(command,
			expect.objectContaining({ itemName: 'schema app' }),
			{ preselectedId: undefined, listItems: expect.any(Function), autoChoose: true })

		expect(stringTranslateToIdMock).toHaveBeenCalledTimes(0)
	})

	it('translates id from index when allowed to', async () => {
		chooseOptionsWithDefaultsMock.mockReturnValueOnce({ ...chooseOptionsDefaults, allowIndex: true })
		expect(await chooseSchemaApp(command, 'id-from-args', { allowIndex: true  })).toBe('chosen-app-id')

		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledTimes(1)
		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledWith({ allowIndex: true })
		expect(stringTranslateToIdMock).toHaveBeenCalledTimes(1)
		expect(stringTranslateToIdMock).toHaveBeenCalledWith(
			expect.objectContaining({ itemName: 'schema app' }),
			'id-from-args',
			expect.any(Function),
		)
		expect(selectFromListMock).toHaveBeenCalledTimes(1)
	})

	test('listItems', async () => {
		expect(await chooseSchemaApp(command)).toBe('chosen-app-id')

		const listItems = selectFromListMock.mock.calls[0][2].listItems

		const schemaAppList = [{ endpointAppId: 'schema-app-id-1' }]
		schemaListMock.mockResolvedValueOnce(schemaAppList)

		expect(await listItems()).toBe(schemaAppList)

		expect(schemaListMock).toHaveBeenCalledTimes(1)
		expect(schemaListMock).toHaveBeenCalledWith()
	})
})
