import { jest } from '@jest/globals'

import type {
	OrganizationResponse,
	OrganizationsEndpoint,
	SchemaApp,
	SchemaAppRequest,
	SchemaEndpoint,
	SmartThingsClient,
	ViperAppLinks,
} from '@smartthings/core-sdk'

import type { Profile } from '../../../../lib/cli-config.js'
import type { stdinIsTTY, stdoutIsTTY } from '../../../../lib/io-util.js'
import type { clipToMaximum, fatalError } from '../../../../lib/util.js'
import type { APICommand } from '../../../../lib/command/api-command.js'
import type { chooseOrganization, organizationDef } from '../../../../lib/command/util/organizations-util.js'
import type { InputData } from '../../../../lib/command/util/schema-util.js'
import type {
	booleanDef,
	createFromUserInput,
	DefaultValueFunction,
	InputDefinition,
	listSelectionDef,
	objectDef,
	optionalDef,
	optionalStringDef,
	staticDef,
	stringDef,
	updateFromUserInput,
} from '../../../../lib/item-input/index.js'
import type {
	arnDef,
	webHookUrlDef,
} from '../../../../lib/command/util/schema-input-primitives.js'
import type {
	createChooseFn,
	ChooseFunction,
} from '../../../../lib/command/util/util-util.js'


const stdinIsTTYMock = jest.fn<typeof stdinIsTTY>().mockReturnValue(true)
const stdoutIsTTYMock = jest.fn<typeof stdoutIsTTY>().mockReturnValue(true)
jest.unstable_mockModule('../../../../lib/io-util.js', () => ({
	stdinIsTTY: stdinIsTTYMock,
	stdoutIsTTY: stdoutIsTTYMock,
}))

const clipToMaximumMock = jest.fn<typeof clipToMaximum>().mockReturnValue('clipped result')
const fatalErrorMock = jest.fn<typeof fatalError>().mockReturnValue('never return' as never)
jest.unstable_mockModule('../../../../lib/util.js', () => ({
	clipToMaximum: clipToMaximumMock,
	fatalError: fatalErrorMock,
}))

const chooseOrganizationMock = jest.fn<typeof chooseOrganization>()
const organizationDefMock = jest.fn<typeof organizationDef>()
jest.unstable_mockModule('../../../../lib/command/util/organizations-util.js', () => ({
	chooseOrganization: chooseOrganizationMock,
	organizationDef: organizationDefMock,
}))

const booleanDefMock = jest.fn<typeof booleanDef>()
const createFromUserInputMock = jest.fn<typeof createFromUserInput>()
const listSelectionDefMock = jest.fn<typeof listSelectionDef>()
const objectDefMock = jest.fn<typeof objectDef>()
const optionalDefMock = jest.fn<typeof optionalDef>()
const optionalStringDefMock = jest.fn<typeof optionalStringDef>()
const staticDefMock = jest.fn<typeof staticDef>()
const stringDefMock = jest.fn<typeof stringDef>()
const updateFromUserInputMock = jest.fn<typeof updateFromUserInput>()
jest.unstable_mockModule('../../../../lib/item-input/index.js', () => ({
	booleanDef: booleanDefMock,
	createFromUserInput: createFromUserInputMock,
	listSelectionDef: listSelectionDefMock,
	maxItemValueLength: 16,
	objectDef: objectDefMock,
	optionalDef: optionalDefMock,
	optionalStringDef: optionalStringDefMock,
	staticDef: staticDefMock,
	stringDef: stringDefMock,
	updateFromUserInput: updateFromUserInputMock,
}))

const arnDefMock = jest.fn<typeof arnDef>()
const webHookUrlDefMock = jest.fn<typeof webHookUrlDef>()
jest.unstable_mockModule('../../../../lib/command/util/schema-input-primitives.js', () => ({
	arnDef: arnDefMock,
	webHookUrlDef: webHookUrlDefMock,
}))

const createChooseFnMock = jest.fn<typeof createChooseFn<SchemaApp>>()
jest.unstable_mockModule('../../../../lib/command/util/util-util.js', () => ({
	createChooseFn: createChooseFnMock,
}))

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /*no-op*/ })


const {
	appLinksDefSummarize,
	buildInputDefinition,
	chooseSchemaAppFn,
	getSchemaAppCreateFromUser,
	getSchemaAppEnsuringOrganization,
	getSchemaAppUpdateFromUser,
	validateFinal,
} = await import('../../../../lib/command/util/schema-util.js')


const schemaAppWithOrganization = {
	endpointAppId: 'has-organization',
	organizationId: 'my-organization',
	appName: 'Has Organization',
} as SchemaApp
const schemaAppWithoutOrganization = {
	endpointAppId: 'sans-organization',
	appName: 'Sans Organization',
} as SchemaApp
const schemaAppNotInList = {
	endpointAppId: 'not-in-list',
	organizationId: 'their-organization',
	appName: 'Not Included in List',
} as SchemaApp
const schemaList = [schemaAppWithOrganization, schemaAppWithoutOrganization]
const apiOrganizationsGetMock = jest.fn<typeof OrganizationsEndpoint.prototype.get>()
const organization1 = { name: 'Organization 1', organizationId: 'organization-id-1' } as OrganizationResponse
const organization2 = { name: 'Organization 2', organizationId: 'organization-id-2' } as OrganizationResponse
const organizations = [organization1, organization2]
const apiOrganizationListMock = jest.fn<typeof OrganizationsEndpoint.prototype.list>()
	.mockResolvedValue(organizations)
const apiSchemaListMock = jest.fn<typeof SchemaEndpoint.prototype.list>()
	.mockResolvedValue(schemaList)
const apiSchemaGetMock = jest.fn<typeof SchemaEndpoint.prototype.get>()
const cloneMock = jest.fn<SmartThingsClient['clone']>()
const clientMock = {
	organizations: {
		get: apiOrganizationsGetMock,
		list: apiOrganizationListMock,
	},
	schema: {
		list: apiSchemaListMock,
		get: apiSchemaGetMock,
	},
	clone: cloneMock,
} as unknown as SmartThingsClient
const clonedClient = { ...clientMock } as SmartThingsClient
cloneMock.mockReturnValue(clonedClient)
const commandMock = { profile: {}, client: clientMock } as APICommand

const appLinksDefMock = { name: 'Generated App Links Def' } as InputDefinition<ViperAppLinks>
const generatedDef = { name: 'Final Generated Def' } as InputDefinition<InputData>


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
	expect(appLinksDefSummarize(input)).toBe('clipped result')
	expect(clipToMaximumMock).toHaveBeenLastCalledWith(result, 16)
})

describe('buildInputDefinition', () => {
	const mockARNInputDef = {} as InputDefinition<string | undefined>
	arnDefMock.mockReturnValue(mockARNInputDef)

	const chinaCommandMock = {
		profile: { clientIdProvider: { baseURL: 'base-url.cn' } } as Profile,
		client: clientMock,
	} as APICommand

	beforeEach(() => {
		objectDefMock.mockReturnValueOnce(appLinksDefMock)
		objectDefMock.mockReturnValueOnce(generatedDef)
	})

	it('includes choice of webhook or lambda for global', async () => {
		expect(await buildInputDefinition(commandMock)).toBe(generatedDef)

		expect(staticDefMock).toHaveBeenCalledTimes(2)
		expect(listSelectionDefMock).toHaveBeenCalledExactlyOnceWith(
			'Hosting Type',
			['lambda', 'webhook'],
			{ default: 'webhook' },
		)
	})

	it('skips webhook for China', async () => {
		expect(await buildInputDefinition(chinaCommandMock)).toBe(generatedDef)

		expect(staticDefMock).toHaveBeenCalledTimes(3)
		expect(staticDefMock).toHaveBeenCalledWith('lambda')
		expect(listSelectionDefMock).not.toHaveBeenCalled()
	})

	it('asks user for organization', async () => {
		expect(await buildInputDefinition(commandMock)).toBe(generatedDef)

		expect(organizationDefMock)
			.toHaveBeenCalledExactlyOnceWith('Schema connector', organizations)
	})

	it('defaults appName to partnerName', async () => {
		expect(await buildInputDefinition(commandMock)).toBe(generatedDef)

		const defaultFunction =
			optionalStringDefMock.mock.calls[0][1]?.default as DefaultValueFunction<string>
		expect(defaultFunction).toBeDefined()

		expect(defaultFunction()).toBe('')
		expect(defaultFunction([])).toBe('')
		expect(defaultFunction([{}])).toBe('')
		expect(defaultFunction([{ partnerName: 'Partner Name' }])).toBe('Partner Name')
	})

	it('uses global ARN fields for global', async () => {
		const commandMock = {
			profile: { clientIdProvider: { baseURL: 'api.smartthings.com' } } as Profile,
			client: clientMock,
		} as APICommand

		expect(await buildInputDefinition(commandMock)).toBe(generatedDef)

		expect(arnDefMock).toHaveBeenCalledTimes(4)
		expect(arnDefMock).toHaveBeenCalledWith('Lambda ARN for US region', false, undefined)
		expect(arnDefMock).toHaveBeenCalledWith('Lambda ARN for EU region', false, undefined)
		expect(arnDefMock).toHaveBeenCalledWith('Lambda ARN for AP region', false, undefined)
		expect(arnDefMock).toHaveBeenCalledWith(
			'Lambda ARN for CN region',
			false,
			undefined,
			{ forChina: true },
		)
	})

	it('uses lambdaArnCN fields for China', async () => {
		const lambdaInitialValue = { appName: 'Schema App', hostingType: 'lambda' } as SchemaAppRequest

		expect(await buildInputDefinition(chinaCommandMock, lambdaInitialValue)).toBe(generatedDef)

		expect(arnDefMock).toHaveBeenCalledTimes(4)
		expect(arnDefMock).toHaveBeenCalledWith('Lambda ARN for US region', true, lambdaInitialValue)
		expect(arnDefMock).toHaveBeenCalledWith('Lambda ARN for EU region', true, lambdaInitialValue)
		expect(arnDefMock).toHaveBeenCalledWith('Lambda ARN for AP region', true, lambdaInitialValue)
		expect(arnDefMock).toHaveBeenCalledWith(
			'Lambda ARN for CN region',
			true,
			lambdaInitialValue,
			{ forChina: true },
		)
	})

	it('provides for app links when selected', async () => {
		expect(await buildInputDefinition(commandMock)).toBe(generatedDef)

		expect(optionalDefMock).toHaveBeenCalledExactlyOnceWith(
			appLinksDefMock,
			expect.any(Function),
			{ initiallyActive: false },
		)

		const isActiveFunction = optionalDefMock.mock.calls[0][1]
		expect(isActiveFunction).toBeDefined()

		expect(isActiveFunction()).toBe(undefined)
		expect(isActiveFunction([])).toBe(undefined)
		expect(isActiveFunction([{}])).toBe(undefined)
		expect(isActiveFunction([{ includeAppLinks: true }])).toBe(true)
		expect(isActiveFunction([{ includeAppLinks: false }])).toBe(false)
	})

	it('starts out with viperAppLinks initiallyActive set to false when initialValue has links',
		async () => {
			const schemaAppRequest = { viperAppLinks: undefined } as SchemaAppRequest
			expect(await buildInputDefinition(commandMock, schemaAppRequest)).toBe(generatedDef)

			expect(optionalDefMock).toHaveBeenCalledExactlyOnceWith(
				appLinksDefMock,
				expect.any(Function),
				{ initiallyActive: false },
			)
		},
	)

	it('starts out with viperAppLinks initiallyActive set to true when initialValue has links',
		async () => {
			const schemaAppRequest = { viperAppLinks: {} } as SchemaAppRequest
			expect(await buildInputDefinition(commandMock, schemaAppRequest)).toBe(generatedDef)

			expect(optionalDefMock).toHaveBeenCalledExactlyOnceWith(
				appLinksDefMock,
				expect.any(Function),
				{ initiallyActive: true },
			)
		},
	)

	it('passes initial value on to webHookUrlDef', async () => {
		const mockWebHookUrlDef = {} as InputDefinition<string | undefined>
		webHookUrlDefMock.mockReturnValue(mockWebHookUrlDef)

		const initialValue = { appName: 'My Schema App' } as SchemaAppRequest
		expect(await buildInputDefinition(commandMock, initialValue)).toBe(generatedDef)

		expect(webHookUrlDefMock).toHaveBeenCalledExactlyOnceWith(false, initialValue)
	})
})

test('getSchemaAppUpdateFromUser', async () => {
	const generatedDef = { name: 'Final Generated Def' } as InputDefinition<InputData>
	objectDefMock.mockReturnValueOnce(appLinksDefMock)
	objectDefMock.mockReturnValueOnce(generatedDef)
	updateFromUserInputMock.mockResolvedValueOnce({
		appName: 'User-updated App Name',
		includeAppLinks: true,
	})
	const original = { appName: 'Original Schema App' } as SchemaApp

	expect(await getSchemaAppUpdateFromUser(commandMock, original, true)).toStrictEqual({
		appName: 'User-updated App Name',
	})

	expect(objectDefMock).toHaveBeenCalledTimes(2)
	expect(updateFromUserInputMock).toHaveBeenCalledExactlyOnceWith(commandMock,
		generatedDef,
		{ ...original, includeAppLinks: false },
		{ dryRun: true })
})

test('getSchemaAppCreateFromUser', async () => {
	const generatedDef = { name: 'Final Generated Def' } as InputDefinition<InputData>
	objectDefMock.mockReturnValueOnce(appLinksDefMock)
	objectDefMock.mockReturnValueOnce(generatedDef)
	createFromUserInputMock.mockResolvedValueOnce({
		appName: 'User-updated App Name',
		includeAppLinks: false,
	})

	expect(await getSchemaAppCreateFromUser(commandMock, false)).toStrictEqual({
		appName: 'User-updated App Name',
	})

	expect(objectDefMock).toHaveBeenCalledTimes(2)
	expect(createFromUserInputMock).toHaveBeenCalledExactlyOnceWith(commandMock,
		generatedDef,
		{ dryRun: false })
})

test('chooseSchemaAppFn uses correct endpoint to list schema apps', async () => {
	const chooseAppMock = jest.fn<ChooseFunction<SchemaApp>>()
	createChooseFnMock.mockReturnValueOnce(chooseAppMock)

	const chooseApp = chooseSchemaAppFn()

	expect(chooseApp).toBe(chooseAppMock)

	expect(createChooseFnMock).toHaveBeenCalledExactlyOnceWith(
		expect.objectContaining({ itemName: 'schema app' }),
		expect.any(Function),
	)

	const schemaList = [{ endpointAppId: 'listed-schema-id' } as SchemaApp]
	const apiSchemaListMock = jest.fn<typeof SchemaEndpoint.prototype.list>()
		.mockResolvedValueOnce(schemaList)
	const listItems = createChooseFnMock.mock.calls[0][1]
	const client = {
		schema: {
			list: apiSchemaListMock,
		},
	} as unknown as SmartThingsClient

	expect(await listItems(client)).toBe(schemaList)

	expect(apiSchemaListMock).toHaveBeenCalledExactlyOnceWith()
})

describe('getSchemaAppEnsuringOrganization', () => {
	const defaultFlags = { json: false, yaml: false }

	it('uses get when the app already has an organization', async () => {
		apiSchemaGetMock.mockResolvedValueOnce(schemaAppWithOrganization)

		const { schemaApp, organizationWasUpdated } =
			await getSchemaAppEnsuringOrganization(commandMock, 'has-organization', defaultFlags)

		expect(schemaApp).toBe(schemaAppWithOrganization)
		expect(organizationWasUpdated).toBe(false)

		expect(apiSchemaListMock).toHaveBeenCalledExactlyOnceWith()
		expect(apiSchemaGetMock).toHaveBeenCalledExactlyOnceWith('has-organization')

		expect(fatalErrorMock).not.toHaveBeenCalled()
		expect(chooseOrganizationMock).not.toHaveBeenCalled()
		expect(apiOrganizationsGetMock).not.toHaveBeenCalled()
		expect(cloneMock).not.toHaveBeenCalled()
	})

	it('uses get when no app found in list', async () => {
		apiSchemaGetMock.mockResolvedValueOnce(schemaAppNotInList)

		const { schemaApp, organizationWasUpdated } =
			await getSchemaAppEnsuringOrganization(commandMock, 'not-in-list', defaultFlags)

		expect(schemaApp).toBe(schemaAppNotInList)
		expect(organizationWasUpdated).toBe(false)

		expect(apiSchemaListMock).toHaveBeenCalledExactlyOnceWith()
		expect(apiSchemaGetMock).toHaveBeenCalledExactlyOnceWith('not-in-list')

		expect(fatalErrorMock).not.toHaveBeenCalled()
		expect(chooseOrganizationMock).not.toHaveBeenCalled()
		expect(apiOrganizationsGetMock).not.toHaveBeenCalled()
		expect(cloneMock).not.toHaveBeenCalled()
	})

	it('sets an organization when app found without an organization', async () => {
		chooseOrganizationMock.mockResolvedValueOnce('organization-id-1')
		apiOrganizationsGetMock.mockResolvedValueOnce(organization1)
		apiSchemaGetMock.mockResolvedValueOnce(schemaAppWithoutOrganization)

		const { schemaApp, organizationWasUpdated } =
			await getSchemaAppEnsuringOrganization(commandMock, 'sans-organization', defaultFlags)

		expect(schemaApp).toBe(schemaAppWithoutOrganization)
		expect(organizationWasUpdated).toBe(true)

		expect(apiSchemaListMock).toHaveBeenCalledExactlyOnceWith()
		expect(consoleLogSpy).toHaveBeenCalledWith(
			'The schema "Sans Organization" (sans-organization) does not have an organization\n' +
				'You must choose one now.',
		)
		expect(chooseOrganizationMock).toHaveBeenCalledExactlyOnceWith(commandMock)
		expect(apiOrganizationsGetMock).toHaveBeenCalledExactlyOnceWith('organization-id-1')
		expect(cloneMock).toHaveBeenCalledExactlyOnceWith(
			// eslint-disable-next-line @typescript-eslint/naming-convention
			{ 'X-ST-Organization': 'organization-id-1' },
		)
		expect(apiSchemaGetMock).toHaveBeenCalledExactlyOnceWith('sans-organization')

		expect(fatalErrorMock).not.toHaveBeenCalled()
	})

	it.each([
		{ flags: { ...defaultFlags, json: true }, stdinIsTTYReturn: true, stdoutIsTTYReturn: true },
		{ flags: { ...defaultFlags, yaml: true }, stdinIsTTYReturn: true, stdoutIsTTYReturn: true  },
		{ flags: { ...defaultFlags, input: 'input-file.json' }, stdinIsTTYReturn: true, stdoutIsTTYReturn: true  },
		{ flags: { ...defaultFlags, output: 'output-file.yaml' }, stdinIsTTYReturn: true, stdoutIsTTYReturn: true  },
		{ flags: defaultFlags, stdinIsTTYReturn: false, stdoutIsTTYReturn: true  },
		{ flags: defaultFlags, stdinIsTTYReturn: true, stdoutIsTTYReturn: false  },
	])(
		'errors with $flags flags, stdin is TTY $stdinIsTTYReturn, stdout is TTY $stdoutIsTTYReturn',
		async ({ flags, stdinIsTTYReturn, stdoutIsTTYReturn }) => {
			apiSchemaGetMock.mockResolvedValueOnce(schemaAppWithoutOrganization)
			if (!stdinIsTTYReturn) {
				stdinIsTTYMock.mockReturnValueOnce(stdinIsTTYReturn)
			}
			if (!stdoutIsTTYReturn) {
				stdoutIsTTYMock.mockReturnValueOnce(stdoutIsTTYReturn)
			}

			expect(await getSchemaAppEnsuringOrganization(commandMock, 'sans-organization', flags))
				.toBe('never return')

			expect(apiSchemaListMock).toHaveBeenCalledExactlyOnceWith()
			expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith(
				'Schema app does not have an organization associated with it.\n' +
					'Please run "smartthings schema sans-organization" and choose an organization ' +
					'when prompted.',
			)

			expect(chooseOrganizationMock).not.toHaveBeenCalled()
			expect(apiOrganizationsGetMock).not.toHaveBeenCalled()
			expect(cloneMock).not.toHaveBeenCalled()
			expect(apiSchemaGetMock).not.toHaveBeenCalled()
		},
	)
})
