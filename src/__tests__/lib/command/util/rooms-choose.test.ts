import { jest } from '@jest/globals'

import { type Room } from '@smartthings/core-sdk'

import { fatalError } from '../../../../lib/util.js'
import { type APICommand } from '../../../../lib/command/api-command.js'
import { selectFromList } from '../../../../lib/command/select.js'
import { getRoomsWithLocation } from '../../../../lib/command/util/rooms-util.js'
import { WithNamedLocation } from '../../../../lib/api-helpers.js'


const fatalErrorMock = jest.fn<typeof fatalError>().mockImplementation(() => { throw Error('fatal error')})
jest.unstable_mockModule('../../../../lib/util.js', () => ({
	fatalError: fatalErrorMock,
}))

const selectFromListMock = jest.fn<typeof selectFromList>()
jest.unstable_mockModule('../../../../lib/command/select.js', () => ({
	selectFromList: selectFromListMock,
}))

const getRoomsWithLocationMock = jest.fn<typeof getRoomsWithLocation>()
jest.unstable_mockModule('../../../../lib/command/util/rooms-util.js', () => ({
	getRoomsWithLocation: getRoomsWithLocationMock,
}))


const { chooseRoom } = await import('../../../../lib/command/util/rooms-choose.js')


describe('chooseRoom', () => {
	const command = {
		client: {
			rooms: {},
		},
	} as APICommand

	const locatedRooms: (Room & WithNamedLocation)[] = [
		{ roomId: 'room-id-1', locationId: 'location-id-1', location: 'Location 1' },
		{ roomId: 'room-id-2', locationId: 'location-id-2', location: 'Location 1' },
	]
	getRoomsWithLocationMock.mockResolvedValue(locatedRooms)

	it('returns selected room and its location', async () => {
		selectFromListMock.mockResolvedValueOnce('room-id-2')

		expect(await chooseRoom(command, 'preselected-id')).toStrictEqual(['room-id-2', 'location-id-2'])

		expect(getRoomsWithLocationMock).toHaveBeenCalledExactlyOnceWith(command.client, undefined)
		expect(selectFromListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ primaryKeyName: 'roomId' }),
			{
				preselectedId: 'preselected-id',
				autoChoose: undefined,
				listItems: expect.any(Function),
			},
		)

		const listItems = selectFromListMock.mock.calls[0][2].listItems

		expect(await listItems()).toBe(locatedRooms)
		// The `listItems` functions should not call `getRoomsWithLocationMock` again.
		expect(getRoomsWithLocationMock).toHaveBeenCalledTimes(1)
	})

	it('throws error when selected room not found', async () => {
		selectFromListMock.mockResolvedValueOnce('invalid-room-id')

		await expect(chooseRoom(command, 'preselected-id')).rejects.toThrow('fatal error')

		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith('could not find room with id invalid-room-id')
	})

	it('throws error when selected room has no location', async () => {
		const dislocatedRooms: (Room & WithNamedLocation)[] = [
			{ roomId: 'dislocated-room-id' },
		]
		getRoomsWithLocationMock.mockResolvedValue(dislocatedRooms)
		selectFromListMock.mockResolvedValueOnce('dislocated-room-id')

		await expect(chooseRoom(command, 'preselected-id')).rejects.toThrow('fatal error')

		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith('could not determine location id for room dislocated-room-id')
	})
})
