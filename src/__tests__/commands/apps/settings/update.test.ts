import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { AppsEndpoint, AppSettingsResponse, SmartThingsClient } from '@smartthings/core-sdk'

import type { buildEpilog } from '../../../../lib/help.js'
import type { APICommand, APICommandFlags } from '../../../../lib/command/api-command.js'
import type {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
} from '../../../../lib/command/input-and-output-item.js'
import { type buildTableOutput, type chooseApp } from '../../../../lib/command/util/apps-util.js'
import type { CommandArgs } from '../../../../commands/locations/update.js'
import { apiCommandMocks } from '../../../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../../../test-lib/builder-mock.js'
import { CustomCommonOutputProducer } from '../../../../lib/command/format.js'
import { tableGeneratorMock } from '../../../test-lib/table-mock.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks('../../../..')

const inputAndOutputItemMock = jest.fn<typeof inputAndOutputItem>()
const inputAndOutputItemBuilderMock = jest.fn<typeof inputAndOutputItemBuilder>()
jest.unstable_mockModule('../../../../lib/command/input-and-output-item.js', () => ({
	inputAndOutputItem: inputAndOutputItemMock,
	inputAndOutputItemBuilder: inputAndOutputItemBuilderMock,
}))

const buildTableOutputMock = jest.fn<typeof buildTableOutput>()
const chooseAppMock = jest.fn<typeof chooseApp>().mockResolvedValue('chosen-id')
jest.unstable_mockModule('../../../../lib/command/util/apps-util.js', () => ({
	buildTableOutput: buildTableOutputMock,
	chooseApp: chooseAppMock,
}))


const { default: cmd } = await import('../../../../commands/apps/settings/update.js')


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
	const apiAppsUpdateSettingsMock = jest.fn<typeof AppsEndpoint.prototype.updateSettings>()
	const clientMock = {
		apps: {
			updateSettings: apiAppsUpdateSettingsMock,
		},
	} as unknown as SmartThingsClient
	const command = {
		client: clientMock,
		tableGenerator: tableGeneratorMock,
	} as APICommand<APICommandFlags>
	apiCommandMock.mockResolvedValue(command)

	const inputArgv = { profile: 'default' } as ArgumentsCamelCase<CommandArgs>

	it('queries user for appId and process via inputAndOutputItem', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(chooseAppMock).toHaveBeenCalledExactlyOnceWith(command, undefined)
		expect(inputAndOutputItemMock).toHaveBeenCalledExactlyOnceWith(
			command,
			{ buildTableOutput: expect.any(Function) },
			expect.any(Function),
		)

		const executeFunction = inputAndOutputItemMock.mock.calls[0][2]

		const settings = { settings: { balloonColor: 'gross color' } } as AppSettingsResponse
		const updatedSettings = { settings: { balloonColor: 'orange' } } as AppSettingsResponse
		apiAppsUpdateSettingsMock.mockResolvedValueOnce(updatedSettings)

		expect(await executeFunction(undefined, settings)).toBe(updatedSettings)

		expect(apiAppsUpdateSettingsMock).toHaveBeenCalledExactlyOnceWith('chosen-id', settings)

		const config = inputAndOutputItemMock.mock.calls[0][1] as
			CustomCommonOutputProducer<AppSettingsResponse>
		buildTableOutputMock.mockReturnValueOnce('table output')

		expect(config.buildTableOutput(updatedSettings)).toBe('table output')

		expect(buildTableOutputMock).toHaveBeenCalledExactlyOnceWith(tableGeneratorMock, updatedSettings)
	})

	it('passes command line id on to chooseApp', async () => {
		await expect(cmd.handler({ ...inputArgv, id: 'argv-id' })).resolves.not.toThrow()

		expect(chooseAppMock).toHaveBeenCalledExactlyOnceWith(command, 'argv-id')
	})
})
