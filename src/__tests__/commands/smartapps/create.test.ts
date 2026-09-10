import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type {
	HttpClientHeaders,
	SmartAppCreateRequest,
	SmartAppCreationResponse,
	SmartAppsEndpoint,
	SmartThingsClient,
} from '@smartthings/core-sdk'

import type { buildEpilog } from '../../../lib/help.js'
import type { fatalError } from '../../../lib/util.js'
import type {
	APIOrganizationCommand,
	APIOrganizationCommandFlags,
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
} from '../../../lib/command/api-organization-command.js'
import type { CustomCommonOutputProducer } from '../../../lib/command/format.js'
import type {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
} from '../../../lib/command/input-and-output-item.js'
import { InputProcessor, userInputProcessor } from '../../../lib/command/input-processor.js'
import { tableFieldDefinitions } from '../../../lib/command/util/smartapps-table.js'
import { getAppCreateRequestFromUser } from '../../../lib/command/util/smartapps-user-input-create.js'
import { chooseOrganization } from '../../../lib/command/util/organizations-util.js'
import type { CommandArgs } from '../../../commands/smartapps/create.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'
import {
	buildTableFromItemMock,
	mockedItemTableOutput,
	tableGeneratorMock,
} from '../../test-lib/table-mock.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const fatalErrorMock = jest.fn<typeof fatalError>()
	.mockImplementation(() => { throw Error('should exit') })
jest.unstable_mockModule('../../../lib/util.js', () => ({
	fatalError: fatalErrorMock,
}))

const apiOrganizationCommandMock = jest.fn<typeof apiOrganizationCommand>()
const apiOrganizationCommandBuilderMock = jest.fn<typeof apiOrganizationCommandBuilder>()
jest.unstable_mockModule('../../../lib/command/api-organization-command.js', () => ({
	apiOrganizationCommand: apiOrganizationCommandMock,
	apiOrganizationCommandBuilder: apiOrganizationCommandBuilderMock,
}))

const inputAndOutputItemMock =
	jest.fn<typeof inputAndOutputItem<SmartAppCreateRequest, SmartAppCreationResponse>>()
		.mockImplementation(async () => { /* no-op */ })
const inputAndOutputItemBuilderMock = jest.fn<typeof inputAndOutputItemBuilder>()
jest.unstable_mockModule('../../../lib/command/input-and-output-item.js', () => ({
	inputAndOutputItem: inputAndOutputItemMock,
	inputAndOutputItemBuilder: inputAndOutputItemBuilderMock,
}))

const inputProcessor = { ioFormat: 'common' } as InputProcessor<SmartAppCreateRequest>
const userInputProcessorMock = jest.fn<typeof userInputProcessor>()
	.mockReturnValue(inputProcessor)
jest.unstable_mockModule('../../../lib/command/input-processor.js', () => ({
	userInputProcessor: userInputProcessorMock,
}))

const getAppCreateRequestFromUserMock = jest.fn<typeof getAppCreateRequestFromUser>()
jest.unstable_mockModule('../../../lib/command/util/smartapps-user-input-create.js', () => ({
	getAppCreateRequestFromUser: getAppCreateRequestFromUserMock,
}))

const chooseOrganizationMock = jest.fn<typeof chooseOrganization>()
jest.unstable_mockModule('../../../lib/command/util/organizations-util.js', () => ({
	chooseOrganization: chooseOrganizationMock,
}))


const { default: cmd } = await import('../../../commands/smartapps/create.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const apiCommandBuilderArgvMock = buildArgvMockStub<APIOrganizationCommandFlags>()
	const {
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APIOrganizationCommandFlags, CommandArgs>()

	apiOrganizationCommandBuilderMock.mockReturnValueOnce(apiCommandBuilderArgvMock)
	inputAndOutputItemBuilderMock.mockReturnValueOnce(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiOrganizationCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(inputAndOutputItemBuilderMock)
		.toHaveBeenCalledExactlyOnceWith(apiCommandBuilderArgvMock)

	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const appRequest = { appName: 'app' } as SmartAppCreateRequest
	const created = {
		app: { appId: 'app-id', webhookSmartApp: { targetUrl: 'targetUrl' } },
	} as SmartAppCreationResponse
	const apiAppsCreateMock = jest.fn<typeof SmartAppsEndpoint.prototype.create>()
		.mockResolvedValue(created)
	const client = {
		smartapps: {
			create: apiAppsCreateMock,
		},
		// eslint-disable-next-line @typescript-eslint/naming-convention
		config: { headers: { 'X-ST-Organization': 'account-id' } as HttpClientHeaders },
	} as unknown as SmartThingsClient
	const command = {
		client,
		tableGenerator: tableGeneratorMock,
	} as unknown as APIOrganizationCommand<CommandArgs>
	apiOrganizationCommandMock.mockResolvedValue(command)
	const organizationId = 'organization-id'
	chooseOrganizationMock.mockResolvedValue(organizationId)
	const inputArgv = {
		profile: 'default',
	} as ArgumentsCamelCase<CommandArgs>

	it('uses inputAndOutputItem with correct config', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(chooseOrganizationMock).toHaveBeenCalledExactlyOnceWith(
			command,
			'account-id',
			{ autoChoose: true, notATTYMessage: expect.stringContaining('not an interactive terminal') },
		)
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

	it('passes no preselected id to chooseOrganization when no organization header is set', async () => {
		client.config.headers = {}

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(chooseOrganizationMock).toHaveBeenCalledExactlyOnceWith(
			command,
			undefined,
			{ autoChoose: true, notATTYMessage: expect.stringContaining('not an interactive terminal') },
		)

		// eslint-disable-next-line @typescript-eslint/naming-convention
		client.config.headers = { 'X-ST-Organization': 'account-id' }
	})

	it('uses `undefined` for the organization id on a dry run without prompting', async () => {
		const dryRunArgv = { ...inputArgv, dryRun: true } as ArgumentsCamelCase<CommandArgs>

		await expect(cmd.handler(dryRunArgv)).resolves.not.toThrow()

		expect(chooseOrganizationMock).toHaveBeenCalledTimes(0)
		const createApp = inputAndOutputItemMock.mock.calls[0][2]
		expect(await createApp(undefined, appRequest)).toBe(created)
		expect(apiAppsCreateMock).toHaveBeenCalledExactlyOnceWith(appRequest, undefined)
	})

	it('creates app using correct endpoint', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()
		const createApp = inputAndOutputItemMock.mock.calls[0][2]

		expect(await createApp(undefined, appRequest)).toBe(created)

		expect(apiAppsCreateMock).toHaveBeenCalledExactlyOnceWith(appRequest, organizationId)
	})

	it('shows a helpful message when creation is forbidden', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()
		const createApp = inputAndOutputItemMock.mock.calls[0][2]

		const forbiddenError = { response: { status: 403 } }
		apiAppsCreateMock.mockRejectedValueOnce(forbiddenError)

		await expect(createApp(undefined, appRequest)).rejects.toThrow('should exit')

		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith(
			expect.stringContaining(
				'https://developer.smartthings.com/console/service-integrations/manage-plans',
			),
		)
	})

	it('rethrows other errors from create', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()
		const createApp = inputAndOutputItemMock.mock.calls[0][2]

		const otherError = { response: { status: 500 } }
		apiAppsCreateMock.mockRejectedValueOnce(otherError)

		await expect(createApp(undefined, appRequest)).rejects.toBe(otherError)

		expect(fatalErrorMock).not.toHaveBeenCalled()
	})

	it('displays basic info', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()
		const config = inputAndOutputItemMock.mock.calls[0][1] as
			CustomCommonOutputProducer<SmartAppCreationResponse>

		expect(config.buildTableOutput(created)).toBe(mockedItemTableOutput)

		expect(buildTableFromItemMock)
			.toHaveBeenCalledExactlyOnceWith(created.app, tableFieldDefinitions)
	})

	it('includes oauth info when present', async () => {
		const createdWithOAuthInfo = {
			app: { appId: 'app-id', webhookSmartApp: { targetUrl: 'targetUrl' } },
			oauthClientId: 'oauth-client-id',
			oauthClientSecret: 'oauth-client-secret',
		} as SmartAppCreationResponse

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()
		const config = inputAndOutputItemMock.mock.calls[0][1] as
			CustomCommonOutputProducer<SmartAppCreationResponse>

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
