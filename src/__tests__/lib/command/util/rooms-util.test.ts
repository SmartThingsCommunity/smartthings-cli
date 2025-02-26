import { jest } from '@jest/globals'

import type { Location, LocationsEndpoint, Room, RoomsEndpoint, SmartThingsClient } from '@smartthings/core-sdk'

import { fatalError } from '../../../../lib/util.js'


const fatalErrorMock = jest.fn<typeof fatalError>().mockImplementation(() => { throw Error('fatal error')})
jest.unstable_mockModule('../../../../lib/util.js', () => ({
	fatalError: fatalErrorMock,
}))


const { getRoomsWithLocation } = await import('../../../../lib/command/util/rooms-util.js')

describe('getRoomsWithLocation', () => {
	const apiLocationsGetMock = jest.fn<typeof LocationsEndpoint.prototype.get>()
	const apiLocationsListMock = jest.fn<typeof LocationsEndpoint.prototype.list>()
	const apiRoomsListMock = jest.fn<typeof RoomsEndpoint.prototype.list>()

	const location1 = { locationId: 'location-id-1', name: 'Location 1' } as Location
	const location2 = { locationId: 'location-id-2', name: 'Location 2' } as Location
	const room1 = { roomId: 'room-id-1', locationId: 'location-id-1' } as Room
	const room2 = { roomId: 'room-id-2', locationId: 'location-id-1' } as Room
	const room3 = { roomId: 'room-id-3', locationId: 'location-id-2' } as Room

	const client = {
		locations: {
			get: apiLocationsGetMock,
			list: apiLocationsListMock,
		},
		rooms: {
			list: apiRoomsListMock,
		},
	} as unknown as SmartThingsClient

	it('throws error when no locations are found', async () => {
		apiLocationsListMock.mockResolvedValueOnce([])

		await expect(getRoomsWithLocation(client)).rejects.toThrow('fatal error')

		expect(apiLocationsListMock).toHaveBeenCalledExactlyOnceWith()
		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('could not find any locations'))

		expect(apiLocationsGetMock).not.toHaveBeenCalled()
		expect(apiRoomsListMock).not.toHaveBeenCalled()
	})

	it('returns rooms with location added', async () => {
		apiLocationsListMock.mockResolvedValueOnce([location1, location2])
		apiRoomsListMock.mockResolvedValueOnce([room1, room2])
		apiRoomsListMock.mockResolvedValueOnce([room3])

		expect(await getRoomsWithLocation(client)).toStrictEqual([
			{ roomId: 'room-id-1', locationId: 'location-id-1', location: 'Location 1' },
			{ roomId: 'room-id-2', locationId: 'location-id-1', location: 'Location 1' },
			{ roomId: 'room-id-3', locationId: 'location-id-2', location: 'Location 2' },
		])

		expect(apiLocationsListMock).toHaveBeenCalledExactlyOnceWith()
		expect(apiRoomsListMock).toHaveBeenCalledTimes(2)
		expect(apiRoomsListMock).toHaveBeenCalledWith(location1.locationId)
		expect(apiRoomsListMock).toHaveBeenCalledWith(location2.locationId)

		expect(apiLocationsGetMock).not.toHaveBeenCalled()
	})

	it('only looks in specified location, if specified', async () => {
		apiLocationsGetMock.mockResolvedValueOnce(location1)
		apiRoomsListMock.mockResolvedValueOnce([room1])

		expect(await getRoomsWithLocation(client, 'requested-location-id')).toStrictEqual([
			{ roomId: 'room-id-1', locationId: 'location-id-1', location: 'Location 1' },
		])

		expect(apiLocationsGetMock).toHaveBeenCalledExactlyOnceWith('requested-location-id')
		expect(apiRoomsListMock).toHaveBeenCalledExactlyOnceWith(location1.locationId)

		expect(apiLocationsListMock).not.toHaveBeenCalled()
	})
})
