import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type {
	AppCreateRequest,
	AppCreationResponse,
	AppsEndpoint,
	SmartThingsClient,
} from '@smartthings/core-sdk'

import type { APICommand, APICommandFlags } from '../../../lib/command/api-command.js'
import type { lambdaAuthBuilder } from '../../../lib/command/common-flags.js'
import type { CustomCommonOutputProducer } from '../../../lib/command/format.js'
import type {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
} from '../../../lib/command/input-and-output-item.js'
import { InputProcessor, userInputProcessor } from '../../../lib/command/input-processor.js'
import { type authorizeApp, tableFieldDefinitions } from '../../../lib/command/util/apps-util.js'
import { getAppCreateRequestFromUser } from '../../../lib/command/util/apps-util-user-input.js'
import type { CommandArgs } from '../../../commands/apps/create.js'
import { apiCommandMocks } from '../../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'
import {
	buildTableFromItemMock,
	mockedItemTableOutput,
	tableGeneratorMock,
} from '../../test-lib/table-mock.js'


const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks('../../..')

const lambdaAuthBuilderMock = jest.fn<typeof lambdaAuthBuilder>()
jest.unstable_mockModule('../../../lib/command/common-flags.js', () => ({
	lambdaAuthBuilder: lambdaAuthBuilderMock,
}))

const inputAndOutputItemMock =
	jest.fn<typeof inputAndOutputItem<AppCreateRequest, AppCreationResponse>>()
		.mockImplementation(async () => { /* no-op */ })
const inputAndOutputItemBuilderMock = jest.fn<typeof inputAndOutputItemBuilder>()
jest.unstable_mockModule('../../../lib/command/input-and-output-item.js', () => ({
	inputAndOutputItem: inputAndOutputItemMock,
	inputAndOutputItemBuilder: inputAndOutputItemBuilderMock,
}))

const inputProcessor = { ioFormat: 'common' } as InputProcessor<AppCreateRequest>
const userInputProcessorMock = jest.fn<typeof userInputProcessor>()
	.mockReturnValue(inputProcessor)
jest.unstable_mockModule('../../../lib/command/input-processor.js', () => ({
	userInputProcessor: userInputProcessorMock,
}))

const authorizeAppMock = jest.fn<typeof authorizeApp>()
jest.unstable_mockModule('../../../lib/command/util/apps-util.js', () => ({
	tableFieldDefinitions,
	authorizeApp: authorizeAppMock,
}))

const getAppCreateRequestFromUserMock = jest.fn<typeof getAppCreateRequestFromUser>()
jest.unstable_mockModule('../../../lib/command/util/apps-util-user-input.js', () => ({
	getAppCreateRequestFromUser: getAppCreateRequestFromUserMock,
}))


const { default: cmd } = await import('../../../commands/apps/create.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const apiCommandBuilderArgvMock = buildArgvMockStub<APICommandFlags>()
	const {
		yargsMock: lambdaAuthBuilderArgvMock,
		exampleMock,
		optionMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APICommandFlags, CommandArgs>()

	apiCommandBuilderMock.mockReturnValueOnce(apiCommandBuilderArgvMock)
	lambdaAuthBuilderMock.mockReturnValueOnce(lambdaAuthBuilderArgvMock)
	inputAndOutputItemBuilderMock.mockReturnValueOnce(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(lambdaAuthBuilderMock)
		.toHaveBeenCalledExactlyOnceWith(apiCommandBuilderArgvMock)
	expect(inputAndOutputItemBuilderMock)
		.toHaveBeenCalledExactlyOnceWith(lambdaAuthBuilderArgvMock)

	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(optionMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const appRequest = { appName: 'app' } as AppCreateRequest
	const created = {
		app: { appId: 'app-id', webhookSmartApp: { targetUrl: 'targetUrl' } },
	} as AppCreationResponse
	const apiAppsCreateMock = jest.fn<typeof AppsEndpoint.prototype.create>()
		.mockResolvedValue(created)
	const client = {
		apps: {
			create: apiAppsCreateMock,
		},
	} as unknown as SmartThingsClient
	const command = { client, tableGenerator: tableGeneratorMock } as APICommand<CommandArgs>
	apiCommandMock.mockResolvedValue(command)
	const inputArgv = { profile: 'default' } as ArgumentsCamelCase<CommandArgs>

	it('uses inputAndOutputItem with correct config', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(userInputProcessorMock).toHaveBeenCalledExactlyOnceWith(expect.any(Function))
		expect(inputAndOutputItemMock).toHaveBeenCalledExactlyOnceWith(
			command,
			{ buildTableOutput: expect.any(Function) },
			expect.any(Function),
			inputProcessor,
		)

		getAppCreateRequestFromUserMock.mockResolvedValueOnce(appRequest)
		const queryUser = userInputProcessorMock.mock.calls[0][0]

		expect(await queryUser()).toBe(appRequest)

		expect(getAppCreateRequestFromUserMock).toHaveBeenCalledExactlyOnceWith(command)
	})

	it('creates app using correct endpoint', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()
		const createApp = inputAndOutputItemMock.mock.calls[0][2]

		expect(await createApp(undefined, appRequest)).toBe(created)

		expect(apiAppsCreateMock).toHaveBeenCalledExactlyOnceWith(appRequest)

		expect(authorizeAppMock).not.toHaveBeenCalled()
	})

	it('authorizes app when requested', async () => {
		await expect(cmd.handler({
			...inputArgv,
			authorize: true,
			principal: 'principal',
			statement: 'statement',
		})).resolves.not.toThrow()
		const createApp = inputAndOutputItemMock.mock.calls[0][2]

		expect(await createApp(undefined, appRequest)).toBe(created)

		expect(apiAppsCreateMock).toHaveBeenCalledExactlyOnceWith(appRequest)
		expect(authorizeAppMock)
			.toHaveBeenCalledExactlyOnceWith(appRequest, 'principal', 'statement')
	})

	it('displays basic info', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()
		const config = inputAndOutputItemMock.mock.calls[0][1] as
			CustomCommonOutputProducer<AppCreationResponse>

		expect(config.buildTableOutput(created)).toBe(mockedItemTableOutput)

		expect(buildTableFromItemMock)
			.toHaveBeenCalledExactlyOnceWith(created.app, tableFieldDefinitions)
	})

	it('includes oauth info when present', async () => {
		const createdWithOAuthInfo = {
			app: { appId: 'app-id', webhookSmartApp: { targetUrl: 'targetUrl' } },
			oauthClientId: 'oauth-client-id',
			oauthClientSecret: 'oauth-client-secret',
		} as AppCreationResponse

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()
		const config = inputAndOutputItemMock.mock.calls[0][1] as
			CustomCommonOutputProducer<AppCreationResponse>

		buildTableFromItemMock.mockReturnValueOnce('basic info table')
		buildTableFromItemMock.mockReturnValueOnce('oauth info table')

		expect(config.buildTableOutput(createdWithOAuthInfo)).toBe(
			'Basic App Data:\nbasic info table\n\n' +
			'OAuth Info (you will not be able to see the OAuth info again so please save it now!):\n' +
			'oauth info table')

		expect(buildTableFromItemMock).toHaveBeenCalledTimes(2)
		expect(buildTableFromItemMock)
			.toHaveBeenCalledWith(createdWithOAuthInfo.app, tableFieldDefinitions)
		expect(buildTableFromItemMock)
			.toHaveBeenCalledWith(createdWithOAuthInfo, ['oauthClientId', 'oauthClientSecret'])
	})
})
