import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { AppsEndpoint, AppSettingsResponse } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/apps/settings.js'
import type { APICommand, APICommandFlags } from '../../../lib/command/api-command.js'
import type { CustomCommonOutputProducer } from '../../../lib/command/format.js'
import type { OutputItemOrListFlags } from '../../../lib/command/listing-io.js'
import type { outputItem, outputItemBuilder } from '../../../lib/command/output-item.js'
import type { SmartThingsCommandFlags } from '../../../lib/command/smartthings-command.js'
import { buildTableOutput, type chooseApp } from '../../../lib/command/util/apps-util.js'
import { apiCommandMocks } from '../../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'
import { tableGeneratorMock } from '../../test-lib/table-mock.js'


const { apiCommandMock, apiCommandBuilderMock, apiDocsURLMock } = apiCommandMocks('../../..')

const outputItemMock = jest.fn<typeof outputItem>()
const outputItemBuilderMock = jest.fn<typeof outputItemBuilder>()
jest.unstable_mockModule('../../../lib/command/output-item.js', () => ({
	outputItem: outputItemMock,
	outputItemBuilder: outputItemBuilderMock,
}))

const buildTableOutputMock = jest.fn<typeof buildTableOutput>()
const chooseAppMock = jest.fn<typeof chooseApp>()
jest.unstable_mockModule('../../../lib/command/util/apps-util.js', () => ({
	buildTableOutput: buildTableOutputMock,
	chooseApp: chooseAppMock,
}))


const { default: cmd } = await import('../../../commands/apps/settings.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiCommandBuilderArgvMock,
		positionalMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<SmartThingsCommandFlags, OutputItemOrListFlags>()

	apiCommandBuilderMock.mockReturnValue(apiCommandBuilderArgvMock)
	outputItemBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(outputItemBuilderMock).toHaveBeenCalledExactlyOnceWith(apiCommandBuilderArgvMock)
	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(apiDocsURLMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

test('handler', async () => {
	const apiAppsGetSettingsMock = jest.fn<typeof AppsEndpoint.prototype.getSettings>()
	const command = {
		client: {
			apps: {
				getSettings: apiAppsGetSettingsMock,
			},
		},
		tableGenerator: tableGeneratorMock,
	} as unknown as APICommand<APICommandFlags>

	apiCommandMock.mockResolvedValueOnce(command)
	chooseAppMock.mockResolvedValueOnce('chosen-app-id')

	const argv = { profile: 'default', idOrIndex: 'cmd-line-id' } as ArgumentsCamelCase<CommandArgs>

	await expect(cmd.handler(argv)).resolves.not.toThrow()

	expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(argv)
	expect(chooseAppMock).toHaveBeenCalledExactlyOnceWith(command, 'cmd-line-id', { allowIndex: true })
	expect(outputItemMock).toHaveBeenCalledExactlyOnceWith(
		command,
		{ buildTableOutput: expect.any(Function) },
		expect.any(Function),
	)

	const config = outputItemMock.mock.calls[0][1] as CustomCommonOutputProducer<AppSettingsResponse>
	const settingsResponse: AppSettingsResponse = { settings: { key: 'value' } }
	buildTableOutputMock.mockReturnValueOnce('table output')

	expect(config.buildTableOutput(settingsResponse)).toBe('table output')

	expect(buildTableOutputMock).toHaveBeenCalledExactlyOnceWith(tableGeneratorMock, settingsResponse)


	const getFunction = outputItemMock.mock.calls[0][2]
	apiAppsGetSettingsMock.mockResolvedValueOnce(settingsResponse)

	expect(await getFunction()).toBe(settingsResponse)

	expect(apiAppsGetSettingsMock).toHaveBeenCalledExactlyOnceWith('chosen-app-id')
})
