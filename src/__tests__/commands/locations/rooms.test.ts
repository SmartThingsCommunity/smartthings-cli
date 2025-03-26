import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { Room, RoomsEndpoint } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/locations/rooms.js'
import { fatalError } from '../../../lib/util.js'
import type { APICommand, APICommandFlags } from '../../../lib/command/api-command.js'
import type { WithNamedLocation } from '../../../lib/api-helpers.js'
import type { outputItemOrList, outputItemOrListBuilder } from '../../../lib/command/listing-io.js'
import { tableFieldDefinitions, tableFieldDefinitionsWithLocationName } from '../../../lib/command/util/rooms-table.js'
import type { getRoomsWithLocation } from '../../../lib/command/util/rooms-util.js'
import { apiCommandMocks } from '../../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'


const fatalErrorMock = jest.fn<typeof fatalError>()
jest.unstable_mockModule('../../../lib/util.js', () => ({
	fatalError: fatalErrorMock,
}))

const { apiCommandMock, apiCommandBuilderMock, apiDocsURLMock } = apiCommandMocks('../../..')

const outputItemOrListMock = jest.fn<typeof outputItemOrList<Room & WithNamedLocation>>()
const outputItemOrListBuilderMock = jest.fn<typeof outputItemOrListBuilder>()
jest.unstable_mockModule('../../../lib/command/listing-io.js', () => ({
	outputItemOrList: outputItemOrListMock,
	outputItemOrListBuilder: outputItemOrListBuilderMock,
}))

const getRoomsWithLocationMock = jest.fn<typeof getRoomsWithLocation>()
jest.unstable_mockModule('../../../lib/command/util/rooms-util.js', () => ({
	getRoomsWithLocation: getRoomsWithLocationMock,
}))


const { default: cmd } = await import('../../../commands/locations/rooms.js')


test('builder', async () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiCommandBuilderArgvMock,
		positionalMock,
		optionMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APICommandFlags, CommandArgs>()

	apiCommandBuilderMock.mockReturnValue(apiCommandBuilderArgvMock)
	outputItemOrListBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(outputItemOrListBuilderMock).toHaveBeenCalledExactlyOnceWith(apiCommandBuilderArgvMock)
	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(optionMock).toHaveBeenCalledTimes(2)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(apiDocsURLMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const apiChannelsGetMock = jest.fn<typeof RoomsEndpoint.prototype.get>()
	const command = {
		client: {
			rooms: {
				get: apiChannelsGetMock,
			},
		},
	} as unknown as APICommand<ArgumentsCamelCase<CommandArgs>>
	apiCommandMock.mockResolvedValue(command)

	const room1 = { roomId: 'room-id-1' } as Room
	const room2 = { roomId: 'room-id-2' } as Room
	const rooms = [room1, room2]

	const baseInputArgv = {
		profile: 'default',
		verbose: false,
	} as ArgumentsCamelCase<CommandArgs>

	it('lists rooms without args', async () => {
		getRoomsWithLocationMock.mockResolvedValueOnce(rooms)

		await expect(cmd.handler(baseInputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(baseInputArgv)
		expect(getRoomsWithLocationMock).toHaveBeenCalledExactlyOnceWith(command.client, undefined)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({
				primaryKeyName: 'roomId',
				listTableFieldDefinitions: tableFieldDefinitions,
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toBe(rooms)
		// `getRoomsWithLocation` should still have only been called once
		expect(getRoomsWithLocationMock).toHaveBeenCalledTimes(1)
	})

	it('includes location name in output in verbose mode', async () => {
		getRoomsWithLocationMock.mockResolvedValueOnce(rooms)
		const inputArgv = {
			...baseInputArgv,
			verbose: true,
		}

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(getRoomsWithLocationMock).toHaveBeenCalledExactlyOnceWith(command.client, undefined)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({
				primaryKeyName: 'roomId',
				listTableFieldDefinitions: tableFieldDefinitionsWithLocationName,
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)
	})

	it('provides details of a specific room', async () => {
		getRoomsWithLocationMock.mockResolvedValueOnce(rooms)

		await expect(cmd.handler({
			...baseInputArgv,
			idOrIndex: 'cmd-line-id',
		})).resolves.not.toThrow()

		expect(getRoomsWithLocationMock).toHaveBeenCalledExactlyOnceWith(command.client, undefined)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({
				primaryKeyName: 'roomId',
				tableFieldDefinitions: tableFieldDefinitions,
			}),
			'cmd-line-id',
			expect.any(Function),
			expect.any(Function),
		)

		const getFunction = outputItemOrListMock.mock.calls[0][4]

		expect(await getFunction('room-id-1')).toBe(room1)
		// `getRoomsWithLocation` should still have only been called once
		expect(getRoomsWithLocationMock).toHaveBeenCalledTimes(1)
	})

	it('includes location name in output in verbose mode with specific room', async () => {
		getRoomsWithLocationMock.mockResolvedValueOnce(rooms)

		await expect(cmd.handler({
			...baseInputArgv,
			idOrIndex: 'cmd-line-id',
			verbose: true,
		})).resolves.not.toThrow()

		expect(getRoomsWithLocationMock).toHaveBeenCalledExactlyOnceWith(command.client, undefined)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({
				primaryKeyName: 'roomId',
				tableFieldDefinitions: tableFieldDefinitionsWithLocationName,
			}),
			'cmd-line-id',
			expect.any(Function),
			expect.any(Function),
		)

		const getFunction = outputItemOrListMock.mock.calls[0][4]

		expect(await getFunction('room-id-1')).toBe(room1)
		// `getRoomsWithLocation` should still have only been called once
		expect(getRoomsWithLocationMock).toHaveBeenCalledTimes(1)
	})

	it('displays error when room not found', async () => {
		getRoomsWithLocationMock.mockResolvedValueOnce(rooms)

		await expect(cmd.handler({
			...baseInputArgv,
			idOrIndex: 'cmd-line-id',
			verbose: true,
		})).resolves.not.toThrow()

		expect(getRoomsWithLocationMock).toHaveBeenCalledExactlyOnceWith(command.client, undefined)

		const getFunction = outputItemOrListMock.mock.calls[0][4]

		await getFunction('bad-room-id')

		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith('Could not find room with id bad-room-id.')
	})
})
