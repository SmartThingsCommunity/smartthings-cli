import { jest } from '@jest/globals'
import { FunctionLike } from 'jest-mock'

import { ArgumentsCamelCase, Argv } from 'yargs'

import { Location, LocationUpdate, LocationsEndpoint, SmartThingsClient } from '@smartthings/core-sdk'

import { chooseLocation, tableFieldDefinitions } from '../../../lib/command/util/locations-util.js'
import { APICommand, APICommandFlags, apiCommand, apiCommandBuilder, apiDocsURL } from '../../../lib/command/api-command.js'
import { inputAndOutputItem, inputAndOutputItemBuilder } from '../../../lib/command/basic-io.js'
import { CommandArgs } from '../../../commands/locations/update.js'


const chooseLocationMock: jest.Mock<typeof chooseLocation> = jest.fn()
jest.unstable_mockModule('../../../lib/command/util/locations-util.js', () => ({
	chooseLocation: chooseLocationMock,
	tableFieldDefinitions,
}))

const apiCommandMock: jest.Mock<typeof apiCommand> = jest.fn()
const apiCommandBuilderMock: jest.Mock<typeof apiCommandBuilder> = jest.fn()
const apiDocsURLMock: jest.Mock<typeof apiDocsURL> = jest.fn()
jest.unstable_mockModule('../../../lib/command/api-command.js', () => ({
	apiCommand: apiCommandMock,
	apiCommandBuilder: apiCommandBuilderMock,
	apiDocsURL: apiDocsURLMock,
}))

const inputAndOutputItemMock: jest.Mock<typeof inputAndOutputItem> = jest.fn()
const inputAndOutputItemBuilderMock: jest.Mock<typeof inputAndOutputItemBuilder> = jest.fn()
jest.unstable_mockModule('../../../lib/command/basic-io.js', () => ({
	inputAndOutputItem: inputAndOutputItemMock,
	inputAndOutputItemBuilder: inputAndOutputItemBuilderMock,
}))


const { default: cmd } = await import('../../../commands/locations/update.js')


type BuilderFunctionMock<T extends FunctionLike> = jest.Mock<T> & T

test('builder', () => {
	const apiCommandArgvMock = jest.fn() as BuilderFunctionMock<Argv<object & APICommandFlags>>
	apiCommandBuilderMock.mockReturnValue(apiCommandArgvMock)

	const inputAndOutputItemArgvMock = jest.fn() as BuilderFunctionMock<Argv<CommandArgs>>

	const positionalMock = jest.fn() as BuilderFunctionMock<Argv<APICommandFlags>['positional']>
	positionalMock.mockReturnValue(inputAndOutputItemArgvMock)
	inputAndOutputItemArgvMock.positional = positionalMock

	const exampleMock = jest.fn() as BuilderFunctionMock<Argv<CommandArgs>['example']>
	exampleMock.mockReturnValue(inputAndOutputItemArgvMock)
	inputAndOutputItemArgvMock.example = exampleMock

	const epilogMock = jest.fn() as BuilderFunctionMock<Argv<CommandArgs>['epilog']>
	epilogMock.mockReturnValue(inputAndOutputItemArgvMock)
	inputAndOutputItemArgvMock.epilog = epilogMock

	inputAndOutputItemBuilderMock.mockReturnValueOnce(inputAndOutputItemArgvMock)

	const yargsMock = jest.fn() as BuilderFunctionMock<Argv<CommandArgs>>

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>
	expect(builder(yargsMock)).toBe(inputAndOutputItemArgvMock)

	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const apiLocationsUpdateMock = jest.fn<typeof LocationsEndpoint.prototype['update']>()
	const clientMock = {
		locations: {
			update: apiLocationsUpdateMock,
		},
	} as unknown as SmartThingsClient
	const command = {
		client: clientMock,
	} as APICommand<APICommandFlags>
	apiCommandMock.mockResolvedValue(command)

	const inputArgv = { profile: 'default' } as ArgumentsCamelCase<CommandArgs>

	it('correctly calls inputAndOutputItem', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledTimes(1)
		expect(apiCommandMock).toHaveBeenCalledWith(inputArgv)
		expect(inputAndOutputItemMock).toHaveBeenCalledTimes(1)
		expect(inputAndOutputItemMock).toHaveBeenCalledWith(
			command,
			{ tableFieldDefinitions },
			expect.any(Function),
		)
	})

	it('uses correct update function to update location', async () => {
		chooseLocationMock.mockResolvedValueOnce('chosen-id')

		await expect(cmd.handler({ ...inputArgv, id: 'command-line-id' })).resolves.not.toThrow()

		expect(chooseLocationMock).toHaveBeenCalledTimes(1)
		expect(chooseLocationMock).toHaveBeenCalledWith(command, 'command-line-id')

		const update = inputAndOutputItemMock.mock.calls[0][2]

		const locationToUpdate = { name: 'Location To Update' } as LocationUpdate
		const updatedLocation = { name: 'Updated Location' } as Location

		apiLocationsUpdateMock.mockResolvedValueOnce(updatedLocation)

		expect(await update(undefined, locationToUpdate)).toBe(updatedLocation)

		expect(apiLocationsUpdateMock).toHaveBeenCalledTimes(1)
		expect(apiLocationsUpdateMock).toHaveBeenCalledWith('chosen-id', locationToUpdate)
	})
})
