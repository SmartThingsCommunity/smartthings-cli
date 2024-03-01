import { jest } from '@jest/globals'
import { FunctionLike } from 'jest-mock'

import { ArgumentsCamelCase, Argv } from 'yargs'

import { LocationsEndpoint, SmartThingsClient } from '@smartthings/core-sdk'

import { CommandArgs } from '../../../commands/locations/delete.js'
import { APICommand, APICommandFlags, apiCommand, apiCommandBuilder, apiDocsURL } from '../../../lib/command/api-command.js'
import { chooseLocation } from '../../../lib/command/util/locations-util.js'


const apiCommandMock = jest.fn<typeof apiCommand>()
const apiCommandBuilderMock = jest.fn<typeof apiCommandBuilder>()
const apiDocsURLMock = jest.fn<typeof apiDocsURL>()
jest.unstable_mockModule('../../../lib/command/api-command.js', () => ({
	apiCommand: apiCommandMock,
	apiCommandBuilder: apiCommandBuilderMock,
	apiDocsURL: apiDocsURLMock,
}))

const chooseLocationMock = jest.fn<typeof chooseLocation>()
jest.unstable_mockModule('../../../lib/command/util/locations-util.js', () => ({
	chooseLocation: chooseLocationMock,
}))

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => true)


const { default: cmd } = await import('../../../commands/locations/delete.js')


type BuilderFunctionMock<T extends FunctionLike> = jest.Mock<T> & T

test('builder', () => {
	const apiCommandArgvMock = jest.fn() as BuilderFunctionMock<Argv<APICommandFlags>>
	apiCommandBuilderMock.mockReturnValue(apiCommandArgvMock)

	const positionalMock = jest.fn() as BuilderFunctionMock<Argv<APICommandFlags>['positional']>
	positionalMock.mockReturnValue(apiCommandArgvMock)
	apiCommandArgvMock.positional = positionalMock

	const exampleMock = jest.fn() as BuilderFunctionMock<Argv<APICommandFlags>['example']>
	exampleMock.mockReturnValue(apiCommandArgvMock)
	apiCommandArgvMock.example = exampleMock

	const epilogMock = jest.fn() as BuilderFunctionMock<Argv<APICommandFlags>['epilog']>
	epilogMock.mockReturnValue(apiCommandArgvMock)
	apiCommandArgvMock.epilog = epilogMock

	const yargsMock = jest.fn() as BuilderFunctionMock<Argv<CommandArgs>>

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>
	expect(builder(yargsMock)).toBe(apiCommandArgvMock)

	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
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

	expect(apiCommandMock).toHaveBeenCalledTimes(1)
	expect(apiCommandMock).toHaveBeenCalledWith(inputArgv)
	expect(chooseLocationMock).toHaveBeenCalledTimes(1)
	expect(chooseLocationMock).toHaveBeenCalledWith(command, 'command-line-id')
	expect(apiLocationsDeleteMock).toHaveBeenCalledTimes(1)
	expect(apiLocationsDeleteMock).toHaveBeenCalledWith('chosen-location-id')

	expect(consoleLogSpy).toHaveBeenLastCalledWith('Location chosen-location-id deleted.')
})
