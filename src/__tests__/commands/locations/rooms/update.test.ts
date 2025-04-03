import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { Room, RoomRequest, RoomsEndpoint } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../../commands/locations/rooms/update.js'
import type { APICommand, APICommandFlags } from '../../../../lib/command/api-command.js'
import type { inputAndOutputItem, inputAndOutputItemBuilder } from '../../../../lib/command/input-and-output-item.js'
import type { chooseRoom } from '../../../../lib/command/util/rooms-choose.js'
import { tableFieldDefinitions } from '../../../../lib/command/util/rooms-table.js'
import { apiCommandMocks } from '../../../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../../../test-lib/builder-mock.js'


const { apiCommandMock, apiCommandBuilderMock, apiDocsURLMock } = apiCommandMocks('../../../..')

const inputAndOutputItemMock = jest.fn<typeof inputAndOutputItem>()
const inputAndOutputItemBuilderMock = jest.fn<typeof inputAndOutputItemBuilder>()
jest.unstable_mockModule('../../../../lib/command/input-and-output-item.js', () => ({
	inputAndOutputItem: inputAndOutputItemMock,
	inputAndOutputItemBuilder: inputAndOutputItemBuilderMock,
}))

const chooseRoomMock = jest.fn<typeof chooseRoom>()
jest.unstable_mockModule('../../../../lib/command/util/rooms-choose.js', () => ({
	chooseRoom: chooseRoomMock,
}))


const { default: cmd } = await import('../../../../commands/locations/rooms/update.js')


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
	expect(inputAndOutputItemBuilderMock)
		.toHaveBeenCalledExactlyOnceWith(apiCommandBuilderArgvMock)

	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(optionMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(apiDocsURLMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

test('handler', async () => {
	const apiRoomsUpdateMock = jest.fn<typeof RoomsEndpoint.prototype.update>()
	const command = {
		client: {
			rooms: {
				update: apiRoomsUpdateMock,
			},
		},
	} as unknown as APICommand<CommandArgs>
	apiCommandMock.mockResolvedValueOnce(command)
	chooseRoomMock.mockResolvedValueOnce(['chosen-room-id', 'location-id-of-chosen-room'])

	const inputArgv = {
		profile: 'default',
		id: 'cmd-line-id',
		location: 'cmd-line-location-id',
	} as ArgumentsCamelCase<CommandArgs>

	await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

	expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
	expect(chooseRoomMock)
		.toHaveBeenCalledExactlyOnceWith(command, 'cmd-line-id', { locationId: 'cmd-line-location-id' })

	expect(inputAndOutputItemMock).toHaveBeenCalledExactlyOnceWith(
		command,
		{ tableFieldDefinitions },
		expect.any(Function),
	)

	const executeAction = inputAndOutputItemMock.mock.calls[0][2]
	const updateRequest = { name: 'Room to Create' } as RoomRequest
	const updated = { roomId: 'room-id' } as Room
	apiRoomsUpdateMock.mockResolvedValueOnce(updated)

	expect(await executeAction(undefined, updateRequest)).toBe(updated)

	expect(apiRoomsUpdateMock)
		.toHaveBeenCalledExactlyOnceWith('chosen-room-id', updateRequest, 'location-id-of-chosen-room')
})
