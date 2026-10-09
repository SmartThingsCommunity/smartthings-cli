import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type {
	PagedSmartApp,
	SmartAppsEndpoint,
	SmartAppSettingsResponse,
	SmartThingsClient,
} from '@smartthings/core-sdk'

import type { buildEpilog } from '../../../../lib/help.js'
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
import type { ChooseFunction } from '../../../../lib/command/util/util-util.js'
import type { chooseSmartAppFn } from '../../../../lib/command/util/smartapps-choose.js'
import type { buildTableOutput } from '../../../../lib/command/util/smartapps-table.js'
import type { CommandArgs } from '../../../../commands/smartapps/settings/update.js'
import { buildArgvMock, buildArgvMockStub } from '../../../test-lib/builder-mock.js'
import { CustomCommonOutputProducer } from '../../../../lib/command/format.js'
import { tableGeneratorMock } from '../../../test-lib/table-mock.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const apiOrganizationCommandMock = jest.fn<typeof apiOrganizationCommand>()
const apiOrganizationCommandBuilderMock = jest.fn<typeof apiOrganizationCommandBuilder>()
jest.unstable_mockModule('../../../../lib/command/api-organization-command.js', () => ({
	apiOrganizationCommand: apiOrganizationCommandMock,
	apiOrganizationCommandBuilder: apiOrganizationCommandBuilderMock,
}))

const inputAndOutputItemMock = jest.fn<typeof inputAndOutputItem>()
const inputAndOutputItemBuilderMock = jest.fn<typeof inputAndOutputItemBuilder>()
jest.unstable_mockModule('../../../../lib/command/input-and-output-item.js', () => ({
	inputAndOutputItem: inputAndOutputItemMock,
	inputAndOutputItemBuilder: inputAndOutputItemBuilderMock,
}))

const chooseSmartAppMock = jest.fn<ChooseFunction<PagedSmartApp>>().mockResolvedValue('chosen-id')
const chooseSmartAppFnMock = jest.fn<typeof chooseSmartAppFn>().mockReturnValue(chooseSmartAppMock)
jest.unstable_mockModule('../../../../lib/command/util/smartapps-choose.js', () => ({
	chooseSmartAppFn: chooseSmartAppFnMock,
}))

const buildTableOutputMock = jest.fn<typeof buildTableOutput>()
jest.unstable_mockModule('../../../../lib/command/util/smartapps-table.js', () => ({
	buildTableOutput: buildTableOutputMock,
}))


const { default: cmd } = await import('../../../../commands/smartapps/settings/update.js')


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
	const apiAppsUpdateSettingsMock = jest.fn<typeof SmartAppsEndpoint.prototype.updateSettings>()
	const clientMock = {
		smartapps: {
			updateSettings: apiAppsUpdateSettingsMock,
		},
		config: { headers: {} },
	} as unknown as SmartThingsClient
	const command = {
		client: clientMock,
		tableGenerator: tableGeneratorMock,
	} as APIOrganizationCommand<APIOrganizationCommandFlags>
	apiOrganizationCommandMock.mockResolvedValue(command)

	const inputArgv = { profile: 'default' } as ArgumentsCamelCase<CommandArgs>

	it('queries user for appId and process via inputAndOutputItem', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(chooseSmartAppFnMock).toHaveBeenCalledExactlyOnceWith({ accountId: undefined })
		expect(chooseSmartAppMock).toHaveBeenCalledExactlyOnceWith(command, undefined)
		expect(inputAndOutputItemMock).toHaveBeenCalledExactlyOnceWith(
			command,
			{ buildTableOutput: expect.any(Function) },
			expect.any(Function),
		)

		const executeFunction = inputAndOutputItemMock.mock.calls[0][2]

		const settings = { settings: { balloonColor: 'gross color' } } as SmartAppSettingsResponse
		const updatedSettings = { settings: { balloonColor: 'orange' } } as SmartAppSettingsResponse
		apiAppsUpdateSettingsMock.mockResolvedValueOnce(updatedSettings)

		expect(await executeFunction(undefined, settings)).toBe(updatedSettings)

		expect(apiAppsUpdateSettingsMock).toHaveBeenCalledExactlyOnceWith('chosen-id', settings)

		const config = inputAndOutputItemMock.mock.calls[0][1] as
			CustomCommonOutputProducer<SmartAppSettingsResponse>
		buildTableOutputMock.mockReturnValueOnce('table output')

		expect(config.buildTableOutput(updatedSettings)).toBe('table output')

		expect(buildTableOutputMock).toHaveBeenCalledExactlyOnceWith(tableGeneratorMock, updatedSettings)
	})

	it('passes command line id on to chooseApp', async () => {
		await expect(cmd.handler({ ...inputArgv, id: 'argv-id' })).resolves.not.toThrow()

		expect(chooseSmartAppMock).toHaveBeenCalledExactlyOnceWith(command, 'argv-id')
	})

	it('passes resolved organization header to chooseSmartAppFn as accountId', async () => {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		clientMock.config.headers = { 'X-ST-Organization': 'organization-id' }

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(chooseSmartAppFnMock).toHaveBeenCalledExactlyOnceWith({ accountId: 'organization-id' })

		clientMock.config.headers = {}
	})
})
