import { outputListing } from '@smartthings/cli-lib'
import { RoomsEndpoint, SmartThingsClient } from '@smartthings/core-sdk'
import RoomsCommand from '../../../commands/locations/rooms'
import { getRoomsByLocation, RoomWithLocation } from '../../../lib/commands/locations/rooms-util'


jest.mock('../../../lib/commands/locations/rooms-util')

describe('RoomsCommand', () => {
	const roomId = 'roomId'
	const locationId = 'locationId'
	const mockOutputListing = jest.mocked(outputListing)
	const mockGetRoomsByLocation = jest.mocked(getRoomsByLocation)
	const getSpy = jest.spyOn(RoomsEndpoint.prototype, 'get').mockImplementation()

	beforeAll(() => {
		mockGetRoomsByLocation.mockResolvedValue([])
	})

	it('calls outputListing correctly', async () => {
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
		const roomList: RoomWithLocation[] = [
			{
				locationId: locationId,
				roomId: roomId,
				locationName: 'test',
			},
		]
		mockGetRoomsByLocation.mockResolvedValueOnce(roomList)

		await expect(RoomsCommand.run([])).resolves.not.toThrow()

		expect(mockGetRoomsByLocation).toBeCalled()

		const listFunction = mockOutputListing.mock.calls[0][3]
		await expect(listFunction()).resolves.toBe(roomList)
	})

	it('calls correct get endpoint when room id is found', async () => {
		const roomList: RoomWithLocation[] = [
			{
				locationId: locationId,
				roomId: roomId,
				locationName: 'test',
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
		const roomList: RoomWithLocation[] = [
			{
				locationId: locationId,
				roomId: 'notFound',
				locationName: 'test',
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
		await expect(RoomsCommand.run([`--location-id=${locationId}`])).resolves.not.toThrow()

		expect(mockGetRoomsByLocation).toBeCalledWith(expect.any(SmartThingsClient), locationId)
		mockGetRoomsByLocation.mockClear()

		await expect(RoomsCommand.run([`-l=${locationId}`])).resolves.not.toThrow()
		expect(mockGetRoomsByLocation).toBeCalledWith(expect.any(SmartThingsClient), locationId)
	})
})
