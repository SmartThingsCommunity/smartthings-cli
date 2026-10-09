import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { PagedSmartApp, SmartAppsEndpoint, SmartAppSettingsResponse } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/smartapps/settings.js'
import type { buildEpilog } from '../../../lib/help.js'
import type {
	APIOrganizationCommand,
	APIOrganizationCommandFlags,
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
} from '../../../lib/command/api-organization-command.js'
import type { CustomCommonOutputProducer } from '../../../lib/command/format.js'
import type { OutputItemOrListFlags } from '../../../lib/command/listing-io.js'
import type { outputItem, outputItemBuilder } from '../../../lib/command/output-item.js'
import type { SmartThingsCommandFlags } from '../../../lib/command/smartthings-command.js'
import type { ChooseFunction } from '../../../lib/command/util/util-util.js'
import type { chooseSmartAppFn } from '../../../lib/command/util/smartapps-choose.js'
import type { buildTableOutput } from '../../../lib/command/util/smartapps-table.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'
import { tableGeneratorMock } from '../../test-lib/table-mock.js'


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

const outputItemMock = jest.fn<typeof outputItem>()
const outputItemBuilderMock = jest.fn<typeof outputItemBuilder>()
jest.unstable_mockModule('../../../lib/command/output-item.js', () => ({
	outputItem: outputItemMock,
	outputItemBuilder: outputItemBuilderMock,
}))

const chooseSmartAppMock = jest.fn<ChooseFunction<PagedSmartApp>>()
const chooseSmartAppFnMock = jest.fn<typeof chooseSmartAppFn>().mockReturnValue(chooseSmartAppMock)
jest.unstable_mockModule('../../../lib/command/util/smartapps-choose.js', () => ({
	chooseSmartAppFn: chooseSmartAppFnMock,
}))

const buildTableOutputMock = jest.fn<typeof buildTableOutput>()
jest.unstable_mockModule('../../../lib/command/util/smartapps-table.js', () => ({
	buildTableOutput: buildTableOutputMock,
}))


const { default: cmd } = await import('../../../commands/smartapps/settings.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiOrganizationCommandBuilderArgvMock,
		positionalMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<SmartThingsCommandFlags, OutputItemOrListFlags>()

	apiOrganizationCommandBuilderMock.mockReturnValue(apiOrganizationCommandBuilderArgvMock)
	outputItemBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiOrganizationCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(outputItemBuilderMock).toHaveBeenCalledExactlyOnceWith(apiOrganizationCommandBuilderArgvMock)
	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

test('handler', async () => {
	const apiAppsGetSettingsMock = jest.fn<typeof SmartAppsEndpoint.prototype.getSettings>()
	const command = {
		client: {
			smartapps: {
				getSettings: apiAppsGetSettingsMock,
			},
			// eslint-disable-next-line @typescript-eslint/naming-convention
			config: { headers: { 'X-ST-Organization': 'organization-id' } },
		},
		tableGenerator: tableGeneratorMock,
	} as unknown as APIOrganizationCommand<APIOrganizationCommandFlags>

	apiOrganizationCommandMock.mockResolvedValueOnce(command)
	chooseSmartAppMock.mockResolvedValueOnce('chosen-app-id')

	const argv = {
		profile: 'default',
		idOrIndex: 'cmd-line-id',
	} as ArgumentsCamelCase<CommandArgs>

	await expect(cmd.handler(argv)).resolves.not.toThrow()

	expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(argv)
	expect(chooseSmartAppFnMock).toHaveBeenCalledExactlyOnceWith({ accountId: 'organization-id' })
	expect(chooseSmartAppMock).toHaveBeenCalledExactlyOnceWith(command, 'cmd-line-id', { allowIndex: true })
	expect(outputItemMock).toHaveBeenCalledExactlyOnceWith(
		command,
		{ buildTableOutput: expect.any(Function) },
		expect.any(Function),
	)

	const config = outputItemMock.mock.calls[0][1] as CustomCommonOutputProducer<SmartAppSettingsResponse>
	const settingsResponse: SmartAppSettingsResponse = { settings: { key: 'value' } }
	buildTableOutputMock.mockReturnValueOnce('table output')

	expect(config.buildTableOutput(settingsResponse)).toBe('table output')

	expect(buildTableOutputMock).toHaveBeenCalledExactlyOnceWith(tableGeneratorMock, settingsResponse)


	const getFunction = outputItemMock.mock.calls[0][2]
	apiAppsGetSettingsMock.mockResolvedValueOnce(settingsResponse)

	expect(await getFunction()).toBe(settingsResponse)

	expect(apiAppsGetSettingsMock).toHaveBeenCalledExactlyOnceWith('chosen-app-id')
})
