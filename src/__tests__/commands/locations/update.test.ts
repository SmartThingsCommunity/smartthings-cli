import { jest } from '@jest/globals'

import { ArgumentsCamelCase, Argv } from 'yargs'

import { Location, LocationUpdate, LocationsEndpoint, SmartThingsClient } from '@smartthings/core-sdk'

import { chooseLocation, tableFieldDefinitions } from '../../../lib/command/util/locations-util.js'
import { APICommand, APICommandFlags, apiCommand, apiCommandBuilder, apiDocsURL } from '../../../lib/command/api-command.js'
import { inputAndOutputItem, inputAndOutputItemBuilder } from '../../../lib/command/basic-io.js'
import { CommandArgs } from '../../../commands/locations/update.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'


const chooseLocationMock = jest.fn<typeof chooseLocation>()
jest.unstable_mockModule('../../../lib/command/util/locations-util.js', () => ({
	chooseLocation: chooseLocationMock,
	tableFieldDefinitions,
}))

const apiCommandMock = jest.fn<typeof apiCommand>()
const apiCommandBuilderMock = jest.fn<typeof apiCommandBuilder>()
const apiDocsURLMock = jest.fn<typeof apiDocsURL>()
jest.unstable_mockModule('../../../lib/command/api-command.js', () => ({
	apiCommand: apiCommandMock,
	apiCommandBuilder: apiCommandBuilderMock,
	apiDocsURL: apiDocsURLMock,
}))

const inputAndOutputItemMock = jest.fn<typeof inputAndOutputItem>()
const inputAndOutputItemBuilderMock = jest.fn<typeof inputAndOutputItemBuilder>()
jest.unstable_mockModule('../../../lib/command/basic-io.js', () => ({
	inputAndOutputItem: inputAndOutputItemMock,
	inputAndOutputItemBuilder: inputAndOutputItemBuilderMock,
}))


const { default: cmd } = await import('../../../commands/locations/update.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiCommandBuilderArgvMock,
		positionalMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APICommandFlags, CommandArgs>()

	apiCommandBuilderMock.mockReturnValueOnce(apiCommandBuilderArgvMock)
	inputAndOutputItemBuilderMock.mockReturnValueOnce(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>
	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledTimes(1)
	expect(apiCommandBuilderMock).toHaveBeenCalledWith(yargsMock)
	expect(inputAndOutputItemBuilderMock).toHaveBeenCalledTimes(1)
	expect(inputAndOutputItemBuilderMock).toHaveBeenCalledWith(apiCommandBuilderArgvMock)

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
