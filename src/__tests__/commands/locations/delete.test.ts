import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { LocationsEndpoint, SmartThingsClient } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/locations/delete.js'
import type { buildEpilog } from '../../../lib/help.js'
import type { APICommand, APICommandFlags } from '../../../lib/command/api-command.js'
import type { chooseLocation } from '../../../lib/command/util/locations-util.js'
import { apiCommandMocks } from '../../test-lib/api-command-mock.js'
import { buildArgvMock } from '../../test-lib/builder-mock.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks('../../..')

const chooseLocationMock = jest.fn<typeof chooseLocation>()
jest.unstable_mockModule('../../../lib/command/util/locations-util.js', () => ({
	chooseLocation: chooseLocationMock,
}))

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /*no-op*/ })


const { default: cmd } = await import('../../../commands/locations/delete.js')


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
	const apiLocationsDeleteMock = jest.fn<typeof LocationsEndpoint.prototype.delete>()
	chooseLocationMock.mockResolvedValueOnce('chosen-location-id')
	const clientMock = {
		locations: {
			delete: apiLocationsDeleteMock,
		},
	} as unknown as SmartThingsClient
	const command = {
		client: clientMock,
	} as APICommand<APICommandFlags>
	apiCommandMock.mockResolvedValue(command)
	const inputArgv = { profile: 'default', id: 'command-line-id' } as ArgumentsCamelCase<CommandArgs>

	await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

	expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
	expect(chooseLocationMock).toHaveBeenCalledExactlyOnceWith(command, 'command-line-id')
	expect(apiLocationsDeleteMock).toHaveBeenCalledExactlyOnceWith('chosen-location-id')

	expect(consoleLogSpy).toHaveBeenLastCalledWith('Location chosen-location-id deleted.')
})
