import { jest } from '@jest/globals'

import { ArgumentsCamelCase, Argv } from 'yargs'

import type { Room, RoomRequest, RoomsEndpoint } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../../commands/locations/rooms/create.js'
import type { APICommand, APICommandFlags } from '../../../../lib/command/api-command.js'
import type {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
} from '../../../../lib/command/input-and-output-item.js'
import type { chooseLocation } from '../../../../lib/command/util/locations-util.js'
import { tableFieldDefinitions } from '../../../../lib/command/util/rooms-table.js'
import { buildArgvMock, buildArgvMockStub } from '../../../test-lib/builder-mock.js'
import { apiCommandMocks } from '../../../test-lib/api-command-mock.js'


const {
	apiCommandMock,
	apiCommandBuilderMock,
	apiDocsURLMock,
} = apiCommandMocks('../../../..')

const inputAndOutputItemMock =
	jest.fn<typeof inputAndOutputItem<RoomRequest, Room>>()
const inputAndOutputItemBuilderMock = jest.fn<typeof inputAndOutputItemBuilder>()
jest.unstable_mockModule('../../../../lib/command/input-and-output-item.js', () => ({
	inputAndOutputItem: inputAndOutputItemMock,
	inputAndOutputItemBuilder: inputAndOutputItemBuilderMock,
}))

const chooseLocationMock = jest.fn<typeof chooseLocation>().mockResolvedValue('chosen-location-id')
jest.unstable_mockModule('../../../../lib/command/util/locations-util.js', () => ({
	chooseLocation: chooseLocationMock,
}))


const { default: cmd } = await import('../../../../commands/locations/rooms/create.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiCommandBuilderArgvMock,
		positionalMock,
		optionMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APICommandFlags, CommandArgs>()

	apiCommandBuilderMock.mockReturnValueOnce(apiCommandBuilderArgvMock)
	inputAndOutputItemBuilderMock.mockReturnValueOnce(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>
	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(inputAndOutputItemBuilderMock).toHaveBeenCalledExactlyOnceWith(apiCommandBuilderArgvMock)

	expect(positionalMock).toHaveBeenCalledTimes(0)
	expect(optionMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(apiDocsURLMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

test('handler', async () => {
	const apiRoomsCreateMock = jest.fn<typeof RoomsEndpoint.prototype.create>()
	const command = {
		client: {
			rooms: {
				create: apiRoomsCreateMock,
			},
		},
	} as unknown as APICommand<CommandArgs>
	apiCommandMock.mockResolvedValueOnce(command)

	const inputArgv = {
		profile: 'default',
		location: 'cmd-line-location-id',
	} as ArgumentsCamelCase<CommandArgs>

	await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

	expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
	expect(chooseLocationMock).toHaveBeenCalledExactlyOnceWith(command, 'cmd-line-location-id')
	expect(inputAndOutputItemMock).toHaveBeenCalledExactlyOnceWith(command, { tableFieldDefinitions }, expect.any(Function))

	const executeAction = inputAndOutputItemMock.mock.calls[0][2]

	const roomToCreate = { name: 'Room to Create' } as Room
	const createdRoom = { roomId: 'room-id' } as Room
	apiRoomsCreateMock.mockResolvedValueOnce(createdRoom)

	expect(await executeAction(undefined, roomToCreate)).toBe(createdRoom)

	expect(apiRoomsCreateMock).toHaveBeenCalledExactlyOnceWith(roomToCreate, 'chosen-location-id')
})
