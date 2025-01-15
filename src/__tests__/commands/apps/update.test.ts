import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import {
	type AppCreateRequest,
	type AppCreationResponse,
	type AppResponse,
	type AppsEndpoint,
	type AppUpdateRequest,
} from '@smartthings/core-sdk'

import type { APICommand, APICommandFlags } from '../../../lib/command/api-command.js'
import type { lambdaAuthBuilder } from '../../../lib/command/common-flags.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
} from '../../../lib/command/input-and-output-item.js'
import { InputProcessor, userInputProcessor } from '../../../lib/command/input-processor.js'
import { type authorizeApp, type chooseApp, tableFieldDefinitions } from '../../../lib/command/util/apps-util.js'
import { getAppUpdateRequestFromUser } from '../../../lib/command/util/apps-user-input-update.js'
import type { CommandArgs } from '../../../commands/apps/create.js'
import { apiCommandMocks } from '../../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'


const { apiCommandMock, apiCommandBuilderMock, apiDocsURLMock } = apiCommandMocks('../../..')

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
const chooseAppMock = jest.fn<typeof chooseApp>()
jest.unstable_mockModule('../../../lib/command/util/apps-util.js', () => ({
	tableFieldDefinitions,
	authorizeApp: authorizeAppMock,
	chooseApp: chooseAppMock,
}))

const getAppUpdateRequestFromUserMock = jest.fn<typeof getAppUpdateRequestFromUser>()
jest.unstable_mockModule('../../../lib/command/util/apps-user-input-update.js', () => ({
	getAppUpdateRequestFromUser: getAppUpdateRequestFromUserMock,
}))

jest.unstable_mockModule('../../../lib/command/util/apps-util-input-primitives.js', () => ({
	smartAppHelpText: 'smartapp help text',
}))


const { default: cmd } = await import('../../../commands/apps/update.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const apiCommandBuilderArgvMock = buildArgvMockStub<APICommandFlags>()
	const {
		yargsMock: lambdaAuthBuilderArgvMock,
		exampleMock,
		positionalMock,
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
	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(optionMock).toHaveBeenCalledTimes(1)
	expect(apiDocsURLMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

const apiAppsUpdateMock = jest.fn<typeof AppsEndpoint.prototype.update>()
const command = {
	client: {
		apps: {
			update: apiAppsUpdateMock,
		},
	},
} as unknown as APICommand<ArgumentsCamelCase<CommandArgs>>

describe('handler', () => {
	apiCommandMock.mockResolvedValue(command)
	chooseAppMock.mockResolvedValue('chosen-app-id')
	const updatedApp = { appName: 'updated app' } as AppResponse
	apiAppsUpdateMock.mockResolvedValue(updatedApp)

	const inputArgv = {
		profile: 'default',
		id: 'cmd-line-app-id',
		authorize: false,
	} as unknown as ArgumentsCamelCase<CommandArgs>

	it('updates app', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(chooseAppMock).toHaveBeenCalledExactlyOnceWith(command, 'cmd-line-app-id')
		expect(userInputProcessorMock).toHaveBeenCalledExactlyOnceWith(expect.any(Function))
		expect(inputAndOutputItemMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({}),
			expect.any(Function),
			inputProcessor,
		)

		const executeUpdate = inputAndOutputItemMock.mock.calls[0][2]
		const updateRequest = { appName: 'app to update' } as AppUpdateRequest

		expect(await executeUpdate(undefined, updateRequest)).toBe(updatedApp)

		expect(apiAppsUpdateMock).toHaveBeenCalledExactlyOnceWith('chosen-app-id', updateRequest)
		expect(authorizeAppMock).not.toHaveBeenCalled()

		const userInputFunction = userInputProcessorMock.mock.calls[0][0]
		getAppUpdateRequestFromUserMock.mockResolvedValueOnce(updateRequest)

		expect(await userInputFunction()).toBe(updateRequest)

		expect(getAppUpdateRequestFromUserMock).toHaveBeenCalledExactlyOnceWith(command, 'chosen-app-id')
	})

	it('authorizes when requested', async () => {
		await expect(cmd.handler({
			...inputArgv,
			authorize: true,
			principal: 'principal',
			statement: 'statement',
		})).resolves.not.toThrow()

		const executeUpdate = inputAndOutputItemMock.mock.calls[0][2]
		const updateRequest = { appName: 'app to update' } as AppUpdateRequest

		expect(await executeUpdate(undefined, updateRequest)).toBe(updatedApp)

		expect(authorizeAppMock).toHaveBeenCalledExactlyOnceWith(updateRequest, 'principal', 'statement')
		expect(apiAppsUpdateMock).toHaveBeenCalledExactlyOnceWith('chosen-app-id', updateRequest)
	})
})
