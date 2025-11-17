import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { AppsEndpoint, SmartThingsClient } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/apps/delete.js'
import type { buildEpilog } from '../../../lib/help.js'
import type { APICommand, APICommandFlags } from '../../../lib/command/api-command.js'
import type { chooseApp } from '../../../lib/command/util/apps-util.js'
import { apiCommandMocks } from '../../test-lib/api-command-mock.js'
import { buildArgvMock } from '../../test-lib/builder-mock.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks('../../..')

const chooseAppMock = jest.fn<typeof chooseApp>()
jest.unstable_mockModule('../../../lib/command/util/apps-util.js', () => ({
	chooseApp: chooseAppMock,
}))

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /*no-op*/ })


const { default: cmd } = await import('../../../commands/apps/delete.js')


test('builder', () => {
	const {
		yargsMock,
		positionalMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<object, CommandArgs>()

	apiCommandBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>
	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledTimes(1)
	expect(apiCommandBuilderMock).toHaveBeenCalledWith(yargsMock)

	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

test('handler', async () => {
	const apiAppsDeleteMock = jest.fn<typeof AppsEndpoint.prototype.delete>()
	chooseAppMock.mockResolvedValueOnce('chosen-app-id')
	const clientMock = {
		apps: {
			delete: apiAppsDeleteMock,
		},
	} as unknown as SmartThingsClient
	const command = {
		client: clientMock,
	} as APICommand<APICommandFlags>
	apiCommandMock.mockResolvedValue(command)
	const inputArgv = { profile: 'default', id: 'command-line-id' } as ArgumentsCamelCase<CommandArgs>

	await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

	expect(apiCommandMock).toHaveBeenCalledTimes(1)
	expect(apiCommandMock).toHaveBeenCalledWith(inputArgv)
	expect(chooseAppMock).toHaveBeenCalledTimes(1)
	expect(chooseAppMock).toHaveBeenCalledWith(command, 'command-line-id')
	expect(apiAppsDeleteMock).toHaveBeenCalledTimes(1)
	expect(apiAppsDeleteMock).toHaveBeenCalledWith('chosen-app-id')

	expect(consoleLogSpy).toHaveBeenLastCalledWith('App chosen-app-id deleted.')
})
