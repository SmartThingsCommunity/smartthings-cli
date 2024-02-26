import { jest } from '@jest/globals'

import { ArgumentsCamelCase, Argv } from 'yargs'

import { Location, LocationsEndpoint, SmartThingsClient } from '@smartthings/core-sdk'

import { APICommand, APICommandFlags, apiCommand, apiCommandBuilder, apiDocsURL } from '../../lib/command/api-command.js'
import { outputItemOrList, outputItemOrListBuilder } from '../../lib/command/listing-io.js'
import { CommandArgs } from '../../commands/locations.js'



const apiCommandMock: jest.Mock<typeof apiCommand> = jest.fn()
const apiCommandBuilderMock: jest.Mock<typeof apiCommandBuilder> = jest.fn()
const apiDocsURLMock: jest.Mock<typeof apiDocsURL> = jest.fn()
jest.unstable_mockModule('../../lib/command/api-command.js', () => ({
	apiCommand: apiCommandMock,
	apiCommandBuilder: apiCommandBuilderMock,
	apiDocsURL: apiDocsURLMock,
}))

const outputItemOrListMock: jest.Mock<typeof outputItemOrList> = jest.fn()
const outputItemOrListBuilderMock: jest.Mock<typeof outputItemOrListBuilder> = jest.fn()
jest.unstable_mockModule('../../lib/command/listing-io.js', () => ({
	outputItemOrList: outputItemOrListMock,
	outputItemOrListBuilder: outputItemOrListBuilderMock,
}))



const { default: cmd } = await import('../../commands/locations.js')


test('builder', () => {
	const apiCommandArgvMock = jest.fn() as jest.Mock<Argv<object & APICommandFlags>> & Argv<object & APICommandFlags>
	apiCommandBuilderMock.mockReturnValue(apiCommandArgvMock)

	const outputItemOrListArgvMock = jest.fn() as jest.Mock<Argv<object & APICommandFlags>> & Argv<object & APICommandFlags>

	const positionalMock = jest.fn() as jest.Mock<Argv<object & APICommandFlags>['positional']> & Argv<object & APICommandFlags>['positional']
	positionalMock.mockReturnValue(outputItemOrListArgvMock)
	outputItemOrListArgvMock.positional = positionalMock

	const exampleMock = jest.fn() as jest.Mock<Argv<object & APICommandFlags>['example']> & Argv<object & APICommandFlags>['example']
	exampleMock.mockReturnValue(outputItemOrListArgvMock)
	outputItemOrListArgvMock.example = exampleMock

	const epilogMock = jest.fn() as jest.Mock<Argv<object & APICommandFlags>['epilog']> & Argv<object & APICommandFlags>['epilog']
	epilogMock.mockReturnValue(outputItemOrListArgvMock)
	outputItemOrListArgvMock.epilog = epilogMock

	outputItemOrListBuilderMock.mockReturnValueOnce(outputItemOrListArgvMock)

	type CommandFlags = APICommandFlags & { testOption?: string }
	const yargsMock = jest.fn() as jest.Mock<Argv<CommandFlags>> & Argv<CommandFlags>

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>
	expect(builder(yargsMock)).toBe(outputItemOrListArgvMock)

	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const location1 = { locationId: 'location-1-id' } as Location
	const location2 = { locationId: 'location-2-id' } as Location
	const locationList = [location1, location2]

	const apiLocationsListMock = jest.fn<typeof LocationsEndpoint.prototype.list>()
	const apiLocationsGetMock = jest.fn<typeof LocationsEndpoint.prototype.get>()
	const clientMock = {
		locations: {
			list: apiLocationsListMock,
			get: apiLocationsGetMock,
		},
	} as unknown as SmartThingsClient
	const command = {
		client: clientMock,
	} as APICommand<APICommandFlags>
	apiCommandMock.mockResolvedValue(command)

	it('lists locations without args', async () => {
		const inputArgv = { profile: 'default' } as ArgumentsCamelCase<CommandArgs>

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledTimes(1)
		expect(apiCommandMock).toHaveBeenCalledWith(inputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			command,
			expect.objectContaining({ primaryKeyName: 'locationId' }),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		apiLocationsListMock.mockResolvedValueOnce(locationList)
		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toStrictEqual(locationList)

		expect(apiLocationsListMock).toHaveBeenCalledTimes(1)
		expect(apiLocationsListMock).toHaveBeenCalledWith()
	})

	it('lists details of a specified location', async () => {
		const inputArgv = {
			profile: 'default',
			idOrIndex: 'location-from-arg',
		} as ArgumentsCamelCase<CommandArgs>

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledTimes(1)
		expect(apiCommandMock).toHaveBeenCalledWith(inputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			command,
			expect.objectContaining({ primaryKeyName: 'locationId' }),
			'location-from-arg',
			expect.any(Function),
			expect.any(Function),
		)

		apiLocationsGetMock.mockResolvedValueOnce(location1)
		const getFunction = outputItemOrListMock.mock.calls[0][4]

		expect(await getFunction('chosen-location-id')).toStrictEqual(location1)

		expect(apiLocationsGetMock).toHaveBeenCalledTimes(1)
		expect(apiLocationsGetMock).toHaveBeenCalledWith('chosen-location-id')
	})
})
