import { jest } from '@jest/globals'

import { ArgumentsCamelCase, Argv } from 'yargs'

import { Location, LocationCreate, LocationsEndpoint, SmartThingsClient } from '@smartthings/core-sdk'

import { tableFieldDefinitions } from '../../../lib/command/util/locations-util.js'
import {
	APICommand,
	APICommandFlags,
	apiCommand,
	apiCommandBuilder,
	apiDocsURL,
} from '../../../lib/command/api-command.js'
import { inputAndOutputItem, inputAndOutputItemBuilder } from '../../../lib/command/basic-io.js'
import { CommandArgs } from '../../../commands/locations/create.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'


jest.unstable_mockModule('../../../lib/command/util/locations-util.js', () => ({
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


const { default: cmd } = await import('../../../commands/locations/create.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiCommandBuilderArgvMock,
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

	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const apiLocationsCreateMock = jest.fn<typeof LocationsEndpoint.prototype['create']>()
	const clientMock = {
		locations: {
			create: apiLocationsCreateMock,
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

	it('uses correct create function to create location', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		const create = inputAndOutputItemMock.mock.calls[0][2]

		const locationCreate = { name: 'Location To Create' } as LocationCreate
		const createdLocation = { name: 'Created Location' } as Location

		apiLocationsCreateMock.mockResolvedValueOnce(createdLocation)

		expect(await create(undefined, locationCreate)).toBe(createdLocation)

		expect(apiLocationsCreateMock).toHaveBeenCalledTimes(1)
		expect(apiLocationsCreateMock).toHaveBeenCalledWith(locationCreate)
	})
})
