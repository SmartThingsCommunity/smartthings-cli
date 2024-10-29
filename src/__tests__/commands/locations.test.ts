import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { Location, LocationsEndpoint, SmartThingsClient } from '@smartthings/core-sdk'

import type { APICommand, APICommandFlags } from '../../lib/command/api-command.js'
import type { outputItemOrList, outputItemOrListBuilder } from '../../lib/command/listing-io.js'
import type { CommandArgs } from '../../commands/locations.js'
import { apiCommandMocks } from '../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../test-lib/builder-mock.js'


const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks('../..')

const outputItemOrListMock = jest.fn<typeof outputItemOrList>()
const outputItemOrListBuilderMock = jest.fn<typeof outputItemOrListBuilder>()
jest.unstable_mockModule('../../lib/command/listing-io.js', () => ({
	outputItemOrList: outputItemOrListMock,
	outputItemOrListBuilder: outputItemOrListBuilderMock,
}))


const { default: cmd } = await import('../../commands/locations.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: outputItemOrListBuilderArgvMock,
		positionalMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APICommandFlags, CommandArgs>()

	apiCommandBuilderMock.mockReturnValue(outputItemOrListBuilderArgvMock)
	outputItemOrListBuilderMock.mockReturnValueOnce(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>
	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledTimes(1)
	expect(apiCommandBuilderMock).toHaveBeenCalledWith(yargsMock)
	expect(outputItemOrListBuilderMock).toHaveBeenCalledTimes(1)
	expect(outputItemOrListBuilderMock).toHaveBeenCalledWith(outputItemOrListBuilderArgvMock)

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
