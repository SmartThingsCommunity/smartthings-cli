import { Room, RoomsEndpoint, SmartThingsClient } from '@smartthings/core-sdk'

import { outputItemOrList, withLocations, WithNamedLocation } from '@smartthings/cli-lib'

import RoomsCommand from '../../../commands/locations/rooms.js'
import { getRoomsWithLocation } from '../../../lib/commands/locations/rooms-util.js'


jest.mock('../../../lib/commands/locations/rooms-util', () => {
	const originalLib = jest.requireActual('../../../lib/commands/locations/rooms-util')
	return {
		...originalLib,
		getRoomsWithLocation: jest.fn(),
	}
})

describe('RoomsCommand', () => {
	const roomId = 'roomId'
	const locationId = 'locationId'
	const mockOutputListing = jest.mocked(outputItemOrList)
	const mockGetRoomsByLocation = jest.mocked(getRoomsWithLocation)
	const getSpy = jest.spyOn(RoomsEndpoint.prototype, 'get').mockImplementation()
	const mockWithLocations = jest.mocked(withLocations)

	beforeAll(() => {
		mockGetRoomsByLocation.mockResolvedValue([])
	})

	it('calls outputItemOrList correctly', async () => {
		await expect(RoomsCommand.run([])).resolves.not.toThrow()

		expect(mockOutputListing).toBeCalledWith(
			expect.any(RoomsCommand),
			expect.objectContaining({
				primaryKeyName: 'roomId',
				sortKeyName: 'name',
				listTableFieldDefinitions: expect.anything(),
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)
	})

	it('returns rooms in list function', async () => {
		const roomList: (Room & WithNamedLocation)[] = [
			{
				locationId: locationId,
				roomId: roomId,
				location: 'test',
			},
		]
		mockGetRoomsByLocation.mockResolvedValueOnce(roomList)

		await expect(RoomsCommand.run([])).resolves.not.toThrow()

		expect(mockGetRoomsByLocation).toBeCalled()

		const listFunction = mockOutputListing.mock.calls[0][3]
		await expect(listFunction()).resolves.toBe(roomList)
	})

	it('calls correct get endpoint when room id is found', async () => {
		const roomList: (Room & WithNamedLocation)[] = [
			{
				locationId: locationId,
				roomId: roomId,
				location: 'test',
			},
		]
		mockGetRoomsByLocation.mockResolvedValueOnce(roomList)

		await expect(RoomsCommand.run([roomId])).resolves.not.toThrow()

		expect(mockGetRoomsByLocation).toBeCalledWith(expect.any(SmartThingsClient), undefined)
		expect(mockOutputListing).toBeCalledWith(
			expect.any(RoomsCommand),
			expect.objectContaining({
				primaryKeyName: 'roomId',
				sortKeyName: 'name',
				listTableFieldDefinitions: expect.anything(),
			}),
			roomId,
			expect.any(Function),
			expect.any(Function),
		)

		const getFunction = mockOutputListing.mock.calls[0][4]

		await expect(getFunction(roomId)).resolves.not.toThrow()
		expect(getSpy).toBeCalledWith(roomId, locationId)
	})

	it('throws error when room id is not found', async () => {
		const roomList: (Room & WithNamedLocation)[] = [
			{
				locationId: locationId,
				roomId: 'notFound',
				location: 'test',
			},
		]
		mockGetRoomsByLocation.mockResolvedValueOnce(roomList)

		await expect(RoomsCommand.run([roomId])).resolves.not.toThrow()

		expect(mockGetRoomsByLocation).toBeCalledWith(expect.any(SmartThingsClient), undefined)
		expect(mockOutputListing).toBeCalledWith(
			expect.any(RoomsCommand),
			expect.objectContaining({
				primaryKeyName: 'roomId',
				sortKeyName: 'name',
				listTableFieldDefinitions: expect.anything(),
			}),
			roomId,
			expect.any(Function),
			expect.any(Function),
		)

		const getFunction = mockOutputListing.mock.calls[0][4]

		await expect(getFunction(roomId)).rejects.toThrow('could not find room')
	})

	it('takes a specific locationId to query via flags', async () => {
		await expect(RoomsCommand.run([`--location=${locationId}`])).resolves.not.toThrow()

		expect(mockGetRoomsByLocation).toBeCalledWith(expect.any(SmartThingsClient), locationId)
		mockGetRoomsByLocation.mockClear()

		await expect(RoomsCommand.run([`-l=${locationId}`])).resolves.not.toThrow()
		expect(mockGetRoomsByLocation).toBeCalledWith(expect.any(SmartThingsClient), locationId)
	})

	it('includes location name when verbose flag is used', async () => {
		await expect(RoomsCommand.run(['--verbose'])).resolves.not.toThrow()

		expect(mockOutputListing).toBeCalledWith(
			expect.any(RoomsCommand),
			expect.objectContaining({
				primaryKeyName: 'roomId',
				sortKeyName: 'name',
				listTableFieldDefinitions: expect.arrayContaining(['location']),
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)
		expect(mockWithLocations).toBeCalled
	})
})
