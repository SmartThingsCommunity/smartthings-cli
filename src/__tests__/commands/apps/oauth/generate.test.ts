import { jest } from '@jest/globals'

import { ArgumentsCamelCase, Argv } from 'yargs'

import type {
	AppOAuthRequest,
	AppsEndpoint,
	GenerateAppOAuthRequest,
	GenerateAppOAuthResponse,
	SmartThingsClient,
} from '@smartthings/core-sdk'

import type { itemInputHelpText, buildEpilog } from '../../../../lib/help.js'
import type { APICommand, APICommandFlags } from '../../../../lib/command/api-command.js'
import type {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
} from '../../../../lib/command/input-and-output-item.js'
import { inputProcessor } from '../../../../lib/command/input-processor.js'
import type { chooseApp } from '../../../../lib/command/util/apps-util.js'
import type { objectDef, stringDef, updateFromUserInput } from '../../../../lib/item-input/index.js'
import type { CommandArgs } from '../../../../commands/apps/oauth/generate.js'
import { buildArgvMock, buildArgvMockStub } from '../../../test-lib/builder-mock.js'
import { apiCommandMocks } from '../../../test-lib/api-command-mock.js'
import { buildInputDefMock } from '../../../test-lib/input-type-mock.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
const itemInputHelpTextMock = jest.fn<typeof itemInputHelpText>()
jest.unstable_mockModule('../../../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
	itemInputHelpText: itemInputHelpTextMock,
}))

const {
	apiCommandMock,
	apiCommandBuilderMock,
} = apiCommandMocks('../../../..')

const inputAndOutputItemMock =
	jest.fn<typeof inputAndOutputItem<GenerateAppOAuthRequest, GenerateAppOAuthResponse>>()
const inputAndOutputItemBuilderMock = jest.fn<typeof inputAndOutputItemBuilder>()
jest.unstable_mockModule('../../../../lib/command/input-and-output-item.js', () => ({
	inputAndOutputItem: inputAndOutputItemMock,
	inputAndOutputItemBuilder: inputAndOutputItemBuilderMock,
}))

const inputProcessorMock = jest.fn<typeof inputProcessor>()
jest.unstable_mockModule('../../../../lib/command/input-processor.js', () => ({
	inputProcessor: inputProcessorMock,
}))

const chooseAppMock = jest.fn<typeof chooseApp>().mockResolvedValue('chosen-app-id')
jest.unstable_mockModule('../../../../lib/command/util/apps-util.js', () => ({
	chooseApp: chooseAppMock,
}))

const oauthAppScopeDefMock = buildInputDefMock<string>('Scopes Mock')
jest.unstable_mockModule('../../../../lib/command/util/apps-input-primitives.js', () => ({
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


const { default: cmd } = await import('../../../../commands/apps/oauth/generate.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiCommandBuilderArgvMock,
		positionalMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APICommandFlags, CommandArgs>()

	apiCommandBuilderMock.mockReturnValueOnce(apiCommandBuilderArgvMock)
	inputAndOutputItemBuilderMock.mockReturnValueOnce(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>
	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(inputAndOutputItemBuilderMock).toHaveBeenCalledExactlyOnceWith(apiCommandBuilderArgvMock)

	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const apiAppsGetOauthMock = jest.fn<typeof AppsEndpoint.prototype.getOauth>()
	const apiAppsRegenerateOauthMock = jest.fn<typeof AppsEndpoint.prototype.regenerateOauth>()
	const client = {
		apps: {
			getOauth: apiAppsGetOauthMock,
			regenerateOauth: apiAppsRegenerateOauthMock,
		},
	} as unknown as SmartThingsClient
	const command = { client } as APICommand<CommandArgs>
	apiCommandMock.mockResolvedValue(command)

	const inputArgv = { profile: 'default' } as ArgumentsCamelCase<CommandArgs>

	it('prompts user when no app specified', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(chooseAppMock).toHaveBeenCalledExactlyOnceWith(command, undefined)
		expect(inputProcessorMock)
			.toHaveBeenCalledExactlyOnceWith(expect.any(Function), expect.any(Function))
		expect(inputAndOutputItemMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({}),
			expect.any(Function),
			expect.objectContaining({}),
		)

		const actionFunction = inputAndOutputItemMock.mock.calls[0][2]

		const regeneratedOAuthData = { oauthClientId: 'client-id' } as GenerateAppOAuthResponse
		apiAppsRegenerateOauthMock.mockResolvedValueOnce(regeneratedOAuthData)
		const generateRequest = { clientName: 'client-name' } as GenerateAppOAuthRequest

		expect(await actionFunction(undefined, generateRequest)).toBe(regeneratedOAuthData)

		expect(apiAppsRegenerateOauthMock)
			.toHaveBeenCalledExactlyOnceWith('chosen-app-id', generateRequest)
	})

	it('accepts app id from command line', async () => {
		await expect(cmd.handler({ ...inputArgv, id: 'app-id-arg' })).resolves.not.toThrow()

		expect(chooseAppMock).toHaveBeenCalledExactlyOnceWith(command, 'app-id-arg')
	})

	const userGeneratedRequest = { clientName: 'client-name' } as GenerateAppOAuthRequest
	const originalOauth = { clientName: 'client-name' } as AppOAuthRequest
	const clientNameMock = buildInputDefMock<string>('Client Name Mock')
	const inputDefMock = buildInputDefMock<GenerateAppOAuthRequest>('Generate Request Mock')
	itemInputHelpTextMock.mockReturnValue('input help text')

	it('allows user-input of request', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		const hasInput = inputProcessorMock.mock.calls[0][0]
		expect(hasInput()).toBe(true)

		const getInputFromUser = inputProcessorMock.mock.calls[0][1]

		const userGeneratedRequest = { clientName: 'client-name' } as GenerateAppOAuthRequest
		const originalOauth = {
			clientName: 'client-name',
			scope: ['r:devices:*'],
		} as AppOAuthRequest

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

		const getInputFromUser = inputProcessorMock.mock.calls[0][1]

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

		const getInputFromUser = inputProcessorMock.mock.calls[0][1]

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
