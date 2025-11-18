import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { DriversEndpoint } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../../commands/edge/drivers/delete.js'
import type { buildEpilog } from '../../../../lib/help.js'
import type { APICommand, APICommandFlags } from '../../../../lib/command/api-command.js'
import type { chooseDriver } from '../../../../lib/command/util/drivers-choose.js'
import { apiCommandMocks } from '../../../test-lib/api-command-mock.js'
import { buildArgvMock } from '../../../test-lib/builder-mock.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks('../../../..')

const chooseDriverMock = jest.fn<typeof chooseDriver>().mockResolvedValue('chosen-driver-id')
jest.unstable_mockModule('../../../../lib/command/util/drivers-choose.js', () => ({
	chooseDriver: chooseDriverMock,
}))

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /* do nothing */ })


const { default: cmd } = await import('../../../../commands/edge/drivers/delete.js')


test('builder', () => {
	const {
		yargsMock,
		positionalMock,
		optionMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APICommandFlags, CommandArgs>()

	apiCommandBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>
	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)

	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(optionMock).toHaveBeenCalledTimes(0)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

test('handler', async () => {
	const apiDriversDeleteMock = jest.fn<typeof DriversEndpoint.prototype.delete>()
	const command = {
		client: {
			drivers: {
				delete: apiDriversDeleteMock,
			},
		},
	} as unknown as APICommand
	apiCommandMock.mockResolvedValue(command)

	const inputArgv = {
		profile: 'default',
		id: 'cmd-line-id',
	} as ArgumentsCamelCase<CommandArgs>

	await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

	expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
	expect(chooseDriverMock)
		.toHaveBeenCalledExactlyOnceWith(command, 'cmd-line-id', { promptMessage: 'Select a driver to delete.' })
	expect(apiDriversDeleteMock).toHaveBeenCalledExactlyOnceWith('chosen-driver-id')
	expect(consoleLogSpy).toHaveBeenCalledExactlyOnceWith('Driver chosen-driver-id deleted.')
})
