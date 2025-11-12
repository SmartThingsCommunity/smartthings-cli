import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { AppOAuthResponse, AppsEndpoint } from '@smartthings/core-sdk'

import type { buildEpilog } from '../../../lib/help.js'
import type { CommandArgs } from '../../../commands/apps/oauth.js'
import type { APICommand, APICommandFlags } from '../../../lib/command/api-command.js'
import type { OutputItemOrListFlags } from '../../../lib/command/listing-io.js'
import type { outputItem, outputItemBuilder } from '../../../lib/command/output-item.js'
import type { SmartThingsCommandFlags } from '../../../lib/command/smartthings-command.js'
import { type chooseApp, oauthTableFieldDefinitions } from '../../../lib/command/util/apps-util.js'
import { apiCommandMocks } from '../../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks('../../..')

const outputItemMock = jest.fn<typeof outputItem>()
const outputItemBuilderMock = jest.fn<typeof outputItemBuilder>()
jest.unstable_mockModule('../../../lib/command/output-item.js', () => ({
	outputItem: outputItemMock,
	outputItemBuilder: outputItemBuilderMock,
}))

const chooseAppMock = jest.fn<typeof chooseApp>()
jest.unstable_mockModule('../../../lib/command/util/apps-util.js', () => ({
	chooseApp: chooseAppMock,
	oauthTableFieldDefinitions,
}))


const { default: cmd } = await import('../../../commands/apps/oauth.js')


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
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

test('handler', async () => {
	const apiAppsGetOauthMock = jest.fn<typeof AppsEndpoint.prototype.getOauth>()
	const command = {
		client: {
			apps: {
				getOauth: apiAppsGetOauthMock,
			},
		},
	} as unknown as APICommand<APICommandFlags>

	apiCommandMock.mockResolvedValueOnce(command)
	chooseAppMock.mockResolvedValueOnce('chosen-app-id')

	const argv = { profile: 'default', idOrIndex: 'cmd-line-id' } as ArgumentsCamelCase<CommandArgs>

	await expect(cmd.handler(argv)).resolves.not.toThrow()

	expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(argv)
	expect(chooseAppMock).toHaveBeenCalledExactlyOnceWith(command, 'cmd-line-id', { allowIndex: true })
	expect(outputItemMock).toHaveBeenCalledExactlyOnceWith(
		command,
		{ tableFieldDefinitions: oauthTableFieldDefinitions },
		expect.any(Function),
	)

	const getFunction = outputItemMock.mock.calls[0][2]
	const oauthResponse = { clientName: 'my-client-name' } as AppOAuthResponse
	apiAppsGetOauthMock.mockResolvedValueOnce(oauthResponse)

	expect(await getFunction()).toBe(oauthResponse)

	expect(apiAppsGetOauthMock).toHaveBeenCalledExactlyOnceWith('chosen-app-id')
})
