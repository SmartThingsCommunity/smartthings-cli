import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type {
	PagedSmartApp,
	SmartAppResponse,
	SmartAppsEndpoint,
	SmartAppUpdateRequest,
} from '@smartthings/core-sdk'

import type { buildEpilog } from '../../../lib/help.js'
import type {
	APIOrganizationCommand,
	APIOrganizationCommandFlags,
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
} from '../../../lib/command/api-organization-command.js'
import type {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
} from '../../../lib/command/input-and-output-item.js'
import type { InputProcessor, userInputProcessor } from '../../../lib/command/input-processor.js'
import type { ChooseFunction } from '../../../lib/command/util/util-util.js'
import type { chooseSmartAppFn } from '../../../lib/command/util/smartapps-choose.js'
import type { paidAccountRequiredHandler } from '../../../lib/command/util/smartapps-util.js'
import type { getAppUpdateRequestFromUser } from '../../../lib/command/util/smartapps-user-input-update.js'
import type { CommandArgs } from '../../../commands/smartapps/update.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const apiOrganizationCommandMock = jest.fn<typeof apiOrganizationCommand>()
const apiOrganizationCommandBuilderMock = jest.fn<typeof apiOrganizationCommandBuilder>()
jest.unstable_mockModule('../../../lib/command/api-organization-command.js', () => ({
	apiOrganizationCommand: apiOrganizationCommandMock,
	apiOrganizationCommandBuilder: apiOrganizationCommandBuilderMock,
}))

const inputAndOutputItemMock =
	jest.fn<typeof inputAndOutputItem<SmartAppUpdateRequest, SmartAppResponse>>()
		.mockImplementation(async () => { /* no-op */ })
const inputAndOutputItemBuilderMock = jest.fn<typeof inputAndOutputItemBuilder>()
jest.unstable_mockModule('../../../lib/command/input-and-output-item.js', () => ({
	inputAndOutputItem: inputAndOutputItemMock,
	inputAndOutputItemBuilder: inputAndOutputItemBuilderMock,
}))

const inputProcessor = { ioFormat: 'common' } as InputProcessor<SmartAppUpdateRequest>
const userInputProcessorMock = jest.fn<typeof userInputProcessor>()
	.mockReturnValue(inputProcessor)
jest.unstable_mockModule('../../../lib/command/input-processor.js', () => ({
	userInputProcessor: userInputProcessorMock,
}))

const chooseSmartAppMock = jest.fn<ChooseFunction<PagedSmartApp>>()
const chooseSmartAppFnMock = jest.fn<typeof chooseSmartAppFn>().mockReturnValue(chooseSmartAppMock)
jest.unstable_mockModule('../../../lib/command/util/smartapps-choose.js', () => ({
	chooseSmartAppFn: chooseSmartAppFnMock,
}))

const paidAccountRequiredErrorHandlerMock = jest.fn<ReturnType<typeof paidAccountRequiredHandler>>()
	.mockImplementation(() => { throw Error('should exit') })
const paidAccountRequiredHandlerMock = jest.fn<typeof paidAccountRequiredHandler>()
	.mockReturnValue(paidAccountRequiredErrorHandlerMock)
jest.unstable_mockModule('../../../lib/command/util/smartapps-util.js', () => ({
	paidAccountRequiredHandler: paidAccountRequiredHandlerMock,
}))

const getAppUpdateRequestFromUserMock = jest.fn<typeof getAppUpdateRequestFromUser>()
jest.unstable_mockModule('../../../lib/command/util/smartapps-user-input-update.js', () => ({
	getAppUpdateRequestFromUser: getAppUpdateRequestFromUserMock,
}))

jest.unstable_mockModule('../../../lib/command/util/smartapps-input-primitives.js', () => ({
	smartAppHelpText: 'smartapp help text',
}))


const { default: cmd } = await import('../../../commands/smartapps/update.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const apiOrganizationCommandBuilderArgvMock = buildArgvMockStub<APIOrganizationCommandFlags>()
	const {
		exampleMock,
		positionalMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APIOrganizationCommandFlags, CommandArgs>()

	apiOrganizationCommandBuilderMock.mockReturnValueOnce(apiOrganizationCommandBuilderArgvMock)
	inputAndOutputItemBuilderMock.mockReturnValueOnce(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiOrganizationCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(inputAndOutputItemBuilderMock)
		.toHaveBeenCalledExactlyOnceWith(apiOrganizationCommandBuilderArgvMock)

	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

const apiAppsUpdateMock = jest.fn<typeof SmartAppsEndpoint.prototype.update>()
const command = {
	client: {
		smartapps: {
			update: apiAppsUpdateMock,
		},
		config: { headers: {} },
	},
} as unknown as APIOrganizationCommand<ArgumentsCamelCase<CommandArgs>>

describe('handler', () => {
	apiOrganizationCommandMock.mockResolvedValue(command)
	chooseSmartAppMock.mockResolvedValue('chosen-app-id')
	const updatedApp = { appName: 'updated app' } as SmartAppResponse
	apiAppsUpdateMock.mockResolvedValue(updatedApp)

	const inputArgv = {
		profile: 'default',
		id: 'cmd-line-app-id',
		authorize: false,
	} as unknown as ArgumentsCamelCase<CommandArgs>

	it('updates app', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(chooseSmartAppFnMock)
			.toHaveBeenCalledExactlyOnceWith({ appType: 'API_ONLY', accountId: undefined })
		expect(chooseSmartAppMock).toHaveBeenCalledExactlyOnceWith(command, 'cmd-line-app-id')
		expect(userInputProcessorMock).toHaveBeenCalledExactlyOnceWith(expect.any(Function))
		expect(inputAndOutputItemMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({}),
			expect.any(Function),
			inputProcessor,
		)

		const executeUpdate = inputAndOutputItemMock.mock.calls[0][2]
		const updateRequest = {} as SmartAppUpdateRequest

		expect(await executeUpdate(undefined, updateRequest)).toBe(updatedApp)

		expect(apiAppsUpdateMock).toHaveBeenCalledExactlyOnceWith('chosen-app-id', updateRequest)

		const userInputFunction = userInputProcessorMock.mock.calls[0][0]
		getAppUpdateRequestFromUserMock.mockResolvedValueOnce(updateRequest)

		expect(await userInputFunction()).toBe(updateRequest)

		expect(getAppUpdateRequestFromUserMock).toHaveBeenCalledExactlyOnceWith(command, 'chosen-app-id')
	})

	it('uses paid account required handler for errors choosing app', async () => {
		const error = { response: { status: 403 } }
		chooseSmartAppMock.mockRejectedValueOnce(error)

		await expect(cmd.handler(inputArgv)).rejects.toThrow('should exit')

		expect(paidAccountRequiredHandlerMock).toHaveBeenCalledExactlyOnceWith('Listing Smart Apps')
		expect(paidAccountRequiredErrorHandlerMock).toHaveBeenCalledExactlyOnceWith(error)
		expect(inputAndOutputItemMock).not.toHaveBeenCalled()
	})

	it('uses paid account required handler for errors updating app', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()
		const executeUpdate = inputAndOutputItemMock.mock.calls[0][2]

		const error = { response: { status: 403 } }
		apiAppsUpdateMock.mockRejectedValueOnce(error)

		await expect(executeUpdate(undefined, {} as SmartAppUpdateRequest)).rejects.toThrow('should exit')

		expect(paidAccountRequiredHandlerMock).toHaveBeenCalledWith('Updating a Smart App')
		expect(paidAccountRequiredErrorHandlerMock).toHaveBeenCalledExactlyOnceWith(error)
	})

	it('passes resolved organization header to chooseSmartAppFn as accountId', async () => {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		command.client.config.headers = { 'X-ST-Organization': 'organization-id' }

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(chooseSmartAppFnMock)
			.toHaveBeenCalledExactlyOnceWith({ appType: 'API_ONLY', accountId: 'organization-id' })

		command.client.config.headers = {}
	})
})
