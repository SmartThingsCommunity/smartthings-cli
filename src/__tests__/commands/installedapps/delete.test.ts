import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import { InstalledApp, type InstalledAppsEndpoint, type SmartThingsClient } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/installedapps/delete.js'
import type { buildEpilog } from '../../../lib/help.js'
import type { chooseInstalledAppFn } from '../../../lib/command/util/installedapps-util.js'
import type { ChooseFunction } from '../../../lib/command/util/util-util.js'
import { apiCommandMocks } from '../../test-lib/api-command-mock.js'
import { buildArgvMock } from '../../test-lib/builder-mock.js'
import { APICommand } from '../../../lib/command/api-command.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks('../../..')

const chooseInstalledAppMock = jest.fn<ChooseFunction<InstalledApp>>()
const chooseInstalledAppFnMock = jest.fn<typeof chooseInstalledAppFn>()
	.mockReturnValue(chooseInstalledAppMock)
jest.unstable_mockModule('../../../lib/command/util/installedapps-util.js', () => ({
	chooseInstalledAppFn: chooseInstalledAppFnMock,
}))

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /*no-op*/ })


const { default: cmd } = await import('../../../commands/installedapps/delete.js')


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
	const apiInstalledAppsDeleteMock = jest.fn<typeof InstalledAppsEndpoint.prototype.delete>()
	chooseInstalledAppMock.mockResolvedValueOnce('chosen-installed-app-id')
	const clientMock = {
		installedApps: {
			delete: apiInstalledAppsDeleteMock,
		},
	} as unknown as SmartThingsClient
	const command = {
		client: clientMock,
	} as APICommand<CommandArgs>
	apiCommandMock.mockResolvedValue(command)
	const inputArgv = {
		profile: 'default',
		id: 'command-line-id',
		verbose: true,
		location: ['location-id-1'],
	} as ArgumentsCamelCase<CommandArgs>

	await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

	expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
	expect(chooseInstalledAppFnMock).toHaveBeenCalledExactlyOnceWith({
		listOptions: {
			locationId: ['location-id-1'],
		},
		verbose: true,
	})
	expect(chooseInstalledAppMock).toHaveBeenCalledExactlyOnceWith(
		command,
		'command-line-id',
		{ promptMessage: 'Select an installed app to delete.' },
	)
	expect(apiInstalledAppsDeleteMock).toHaveBeenCalledExactlyOnceWith('chosen-installed-app-id')

	expect(consoleLogSpy).toHaveBeenLastCalledWith('Installed app chosen-installed-app-id deleted.')
})
