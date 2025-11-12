import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import { type AppsEndpoint, AppType, PagedApp } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/apps/register.js'
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


const { default: cmd } = await import('../../../commands/apps/register.js')


test('builder', () => {
	const {
		yargsMock,
		positionalMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APICommandFlags, CommandArgs>()

	apiCommandBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>
	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)

	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

test('handler', async () => {
	const apiAppsRegisterMock = jest.fn<typeof AppsEndpoint.prototype.register>()
	const command = {
		client: { apps: { register: apiAppsRegisterMock } },
	} as unknown as APICommand<ArgumentsCamelCase<CommandArgs>>
	apiCommandMock.mockResolvedValueOnce(command)
	chooseAppMock.mockResolvedValueOnce('chosen-id')
	const inputArgv = { profile: 'default', id: 'id-from-cmd-line' } as ArgumentsCamelCase<CommandArgs>

	await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

	expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
	expect(chooseAppMock).toHaveBeenCalledExactlyOnceWith(
		command,
		'id-from-cmd-line',
		expect.objectContaining({ listFilter: expect.any(Function) }),
	)
	expect(apiAppsRegisterMock).toHaveBeenCalledExactlyOnceWith('chosen-id')
	expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Registration request sent'))

	const listFilter = chooseAppMock.mock.calls[0][2]?.listFilter
	expect(listFilter?.({ appType: AppType.WEBHOOK_SMART_APP } as PagedApp, 0, [])).toBeTrue()
	expect(listFilter?.({ appType: AppType.API_ONLY } as PagedApp, 0, [])).toBeTrue()
	expect(listFilter?.({ appType: AppType.LAMBDA_SMART_APP } as PagedApp, 0, [])).toBeFalse()
})
