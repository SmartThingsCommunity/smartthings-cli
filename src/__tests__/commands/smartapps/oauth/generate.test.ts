import { jest } from '@jest/globals'

import { ArgumentsCamelCase, Argv } from 'yargs'

import type {
	GenerateSmartAppOAuthRequest,
	GenerateSmartAppOAuthResponse,
	PagedSmartApp,
	SmartAppOAuthRequest,
	SmartAppsEndpoint,
	SmartThingsClient,
} from '@smartthings/core-sdk'

import type { itemInputHelpText, buildEpilog } from '../../../../lib/help.js'
import type {
	APIOrganizationCommand,
	APIOrganizationCommandFlags,
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
} from '../../../../lib/command/api-organization-command.js'
import type {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
} from '../../../../lib/command/input-and-output-item.js'
import { userInputProcessor } from '../../../../lib/command/input-processor.js'
import type { ChooseFunction } from '../../../../lib/command/util/util-util.js'
import type { chooseSmartAppFn } from '../../../../lib/command/util/smartapps-choose.js'
import type { objectDef, stringDef, updateFromUserInput } from '../../../../lib/item-input/index.js'
import type { CommandArgs } from '../../../../commands/smartapps/oauth/generate.js'
import { buildArgvMock, buildArgvMockStub } from '../../../test-lib/builder-mock.js'
import { buildInputDefMock } from '../../../test-lib/input-type-mock.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
const itemInputHelpTextMock = jest.fn<typeof itemInputHelpText>()
jest.unstable_mockModule('../../../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
	itemInputHelpText: itemInputHelpTextMock,
}))

const apiOrganizationCommandMock = jest.fn<typeof apiOrganizationCommand>()
const apiOrganizationCommandBuilderMock = jest.fn<typeof apiOrganizationCommandBuilder>()
jest.unstable_mockModule('../../../../lib/command/api-organization-command.js', () => ({
	apiOrganizationCommand: apiOrganizationCommandMock,
	apiOrganizationCommandBuilder: apiOrganizationCommandBuilderMock,
}))

const inputAndOutputItemMock =
	jest.fn<typeof inputAndOutputItem<GenerateSmartAppOAuthRequest, GenerateSmartAppOAuthResponse>>()
const inputAndOutputItemBuilderMock = jest.fn<typeof inputAndOutputItemBuilder>()
jest.unstable_mockModule('../../../../lib/command/input-and-output-item.js', () => ({
	inputAndOutputItem: inputAndOutputItemMock,
	inputAndOutputItemBuilder: inputAndOutputItemBuilderMock,
}))

const userInputProcessorMock = jest.fn<typeof userInputProcessor>()
	.mockReturnValue({} as unknown as ReturnType<typeof userInputProcessor>)
jest.unstable_mockModule('../../../../lib/command/input-processor.js', () => ({
	userInputProcessor: userInputProcessorMock,
}))

const chooseSmartAppMock = jest.fn<ChooseFunction<PagedSmartApp>>().mockResolvedValue('chosen-app-id')
const chooseSmartAppFnMock = jest.fn<typeof chooseSmartAppFn>().mockReturnValue(chooseSmartAppMock)
jest.unstable_mockModule('../../../../lib/command/util/smartapps-choose.js', () => ({
	chooseSmartAppFn: chooseSmartAppFnMock,
}))

const oauthAppScopeDefMock = buildInputDefMock<string>('Scopes Mock')
jest.unstable_mockModule('../../../../lib/command/util/smartapps-input-primitives.js', () => ({
	oauthAppScopeDef: oauthAppScopeDefMock,
}))

const updateFromUserInputMock = jest.fn<typeof updateFromUserInput>()
const objectDefMock = jest.fn<typeof objectDef>()
const stringDefMock = jest.fn<typeof stringDef>()
jest.unstable_mockModule('../../../../lib/item-input/index.js', () => ({
	objectDef: objectDefMock,
	stringDef: stringDefMock,
	updateFromUserInput: updateFromUserInputMock,
}))


const { default: cmd } = await import('../../../../commands/smartapps/oauth/generate.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiOrganizationCommandBuilderArgvMock,
		positionalMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APIOrganizationCommandFlags, CommandArgs>()

	apiOrganizationCommandBuilderMock.mockReturnValueOnce(apiOrganizationCommandBuilderArgvMock)
	inputAndOutputItemBuilderMock.mockReturnValueOnce(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>
	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiOrganizationCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(inputAndOutputItemBuilderMock).toHaveBeenCalledExactlyOnceWith(apiOrganizationCommandBuilderArgvMock)

	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const apiAppsGetOauthMock = jest.fn<typeof SmartAppsEndpoint.prototype.getOauth>()
	const apiAppsRegenerateOauthMock = jest.fn<typeof SmartAppsEndpoint.prototype.regenerateOauth>()
	const client = {
		smartapps: {
			getOauth: apiAppsGetOauthMock,
			regenerateOauth: apiAppsRegenerateOauthMock,
		},
		config: { headers: {} },
	} as unknown as SmartThingsClient
	const command = { client } as APIOrganizationCommand<CommandArgs>
	apiOrganizationCommandMock.mockResolvedValue(command)

	const inputArgv = { profile: 'default' } as ArgumentsCamelCase<CommandArgs>

	it('prompts user when no app specified', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(chooseSmartAppFnMock).toHaveBeenCalledExactlyOnceWith({ accountId: undefined })
		expect(chooseSmartAppMock).toHaveBeenCalledExactlyOnceWith(command, undefined)
		expect(userInputProcessorMock).toHaveBeenCalledExactlyOnceWith(expect.any(Function))
		expect(inputAndOutputItemMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({}),
			expect.any(Function),
			expect.objectContaining({}),
		)

		const actionFunction = inputAndOutputItemMock.mock.calls[0][2]

		const regeneratedOAuthData = { oauthClientId: 'client-id' } as GenerateSmartAppOAuthResponse
		apiAppsRegenerateOauthMock.mockResolvedValueOnce(regeneratedOAuthData)
		const generateRequest = { clientName: 'client-name' } as GenerateSmartAppOAuthRequest

		expect(await actionFunction(undefined, generateRequest)).toBe(regeneratedOAuthData)

		expect(apiAppsRegenerateOauthMock)
			.toHaveBeenCalledExactlyOnceWith('chosen-app-id', generateRequest)
	})

	it('accepts app id from command line', async () => {
		await expect(cmd.handler({ ...inputArgv, id: 'app-id-arg' })).resolves.not.toThrow()

		expect(chooseSmartAppMock).toHaveBeenCalledExactlyOnceWith(command, 'app-id-arg')
	})

	it('passes resolved organization header to chooseSmartAppFn as accountId', async () => {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		client.config.headers = { 'X-ST-Organization': 'organization-id' }

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(chooseSmartAppFnMock).toHaveBeenCalledExactlyOnceWith({ accountId: 'organization-id' })

		client.config.headers = {}
	})

	const userGeneratedRequest = { clientName: 'client-name' } as GenerateSmartAppOAuthRequest
	const originalOauth = { clientName: 'client-name' } as SmartAppOAuthRequest
	const clientNameMock = buildInputDefMock<string>('Client Name Mock')
	const inputDefMock = buildInputDefMock<GenerateSmartAppOAuthRequest>('Generate Request Mock')
	itemInputHelpTextMock.mockReturnValue('input help text')

	it('allows user-input of request', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		const getInputFromUser = userInputProcessorMock.mock.calls[0][0] as () => Promise<unknown>

		const userGeneratedRequest = { clientName: 'client-name' } as GenerateSmartAppOAuthRequest
		const originalOauth = {
			clientName: 'client-name',
			scope: ['r:devices:*'],
		} as SmartAppOAuthRequest

		apiAppsGetOauthMock.mockResolvedValueOnce(originalOauth)
		stringDefMock.mockReturnValueOnce(clientNameMock)
		objectDefMock.mockReturnValueOnce(inputDefMock)
		updateFromUserInputMock.mockResolvedValueOnce(userGeneratedRequest)

		expect(await getInputFromUser()).toBe(userGeneratedRequest)

		expect(apiAppsGetOauthMock).toHaveBeenCalledExactlyOnceWith('chosen-app-id')
		expect(stringDefMock).toHaveBeenCalledExactlyOnceWith('Client Name')
		expect(objectDefMock).toHaveBeenCalledExactlyOnceWith(
			'Generate Request',
			expect.objectContaining({ clientName: clientNameMock, scope: oauthAppScopeDefMock }),
			expect.objectContaining({ helpText: 'input help text' }),
		)
		expect(updateFromUserInputMock).toHaveBeenCalledExactlyOnceWith(
			command,
			inputDefMock,
			{ ...originalOauth, scope: ['r:devices:*'] },
			{ dryRun: false },
		)
	})

	it('forces starting scopes to at least be an empty array', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		const getInputFromUser = userInputProcessorMock.mock.calls[0][0] as () => Promise<unknown>

		apiAppsGetOauthMock.mockResolvedValueOnce(originalOauth)
		stringDefMock.mockReturnValueOnce(clientNameMock)
		objectDefMock.mockReturnValueOnce(inputDefMock)
		updateFromUserInputMock.mockResolvedValueOnce(userGeneratedRequest)

		expect(await getInputFromUser()).toBe(userGeneratedRequest)

		expect(updateFromUserInputMock).toHaveBeenCalledExactlyOnceWith(
			command,
			inputDefMock,
			{ ...originalOauth, scope: [] },
			{ dryRun: false },
		)
	})

	it('passes dry-run flag on to updateFromUserInput', async () => {
		await expect(cmd.handler({ ...inputArgv, dryRun: true })).resolves.not.toThrow()

		const getInputFromUser = userInputProcessorMock.mock.calls[0][0] as () => Promise<unknown>

		apiAppsGetOauthMock.mockResolvedValueOnce(originalOauth)
		stringDefMock.mockReturnValueOnce(clientNameMock)
		objectDefMock.mockReturnValueOnce(inputDefMock)
		updateFromUserInputMock.mockResolvedValueOnce(userGeneratedRequest)

		expect(await getInputFromUser()).toBe(userGeneratedRequest)

		expect(updateFromUserInputMock).toHaveBeenCalledExactlyOnceWith(
			command,
			inputDefMock,
			{ ...originalOauth, scope: [] },
			{ dryRun: true },
		)
	})
})
