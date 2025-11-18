import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { RoomsEndpoint } from '@smartthings/core-sdk'

import { CommandArgs } from '../../../../commands/locations/rooms/delete.js'
import type { buildEpilog } from '../../../../lib/help.js'
import type { chooseRoom } from '../../../../lib/command/util/rooms-choose.js'
import { apiCommandMocks } from '../../../test-lib/api-command-mock.js'
import { buildArgvMock } from '../../../test-lib/builder-mock.js'
import { APICommand } from '../../../../lib/command/api-command.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks('../../../..')

const chooseRoomMock = jest.fn<typeof chooseRoom>()
jest.unstable_mockModule('../../../../lib/command/util/rooms-choose.js', () => ({
	chooseRoom: chooseRoomMock,
}))

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /*no-op*/ })


const { default: cmd } = await import('../../../../commands/locations/rooms/delete.js')


test('builder', () => {
	const {
		yargsMock,
		optionMock,
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

	expect(optionMock).toHaveBeenCalledTimes(1)
	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

test('handler', async () => {
	const apiRoomsDeleteMock = jest.fn<typeof RoomsEndpoint.prototype.delete>()
	const command = {
		client: {
			rooms: {
				delete: apiRoomsDeleteMock,
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
	expect(apiRoomsDeleteMock).toHaveBeenCalledExactlyOnceWith('chosen-room-id', 'location-id-of-chosen-room')

	expect(consoleLogSpy).toHaveBeenLastCalledWith('Room chosen-room-id deleted.')
})
