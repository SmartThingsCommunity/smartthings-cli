import { v4 as uuid } from 'uuid'
import { ListDataFunction, ListingOutputConfig, LookupDataFunction, outputListing, SmartThingsCommandInterface } from '@smartthings/cli-lib'
import { Room, RoomsEndpoint, SmartThingsClient } from '@smartthings/core-sdk'
import RoomsCommand from '../../../commands/locations/rooms'
import { getRoomsByLocation, RoomWithLocation } from '../../../lib/commands/locations/rooms/rooms-util'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		outputListing: jest.fn(),
		selectFromList: jest.fn(),
	}
})

jest.mock('../../../lib/commands/locations/rooms/rooms-util')

describe('RoomsCommand', () => {
	const mockListing = outputListing as unknown as
		jest.Mock<Promise<void>, [
			SmartThingsCommandInterface,
			ListingOutputConfig<Room, RoomWithLocation>,
			string | undefined,
			ListDataFunction<RoomWithLocation>,
			LookupDataFunction<string, Room>
		]>
	const mockGetRoomsByLocation = getRoomsByLocation as
		jest.Mock<Promise<RoomWithLocation[]>, [SmartThingsClient, string | undefined]>
	const getSpy = jest.spyOn(RoomsEndpoint.prototype, 'get').mockImplementation()

	beforeAll(() => {
		mockGetRoomsByLocation.mockResolvedValue([])
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('calls outputListing correctly', async () => {
		await expect(RoomsCommand.run()).resolves.not.toThrow()

		expect(mockListing).toBeCalledWith(
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
				locationId: uuid(),
				roomId: uuid(),
				locationName: 'test',
			},
		]
		mockGetRoomsByLocation.mockResolvedValueOnce(roomList)

		await expect(RoomsCommand.run()).resolves.not.toThrow()

		expect(mockGetRoomsByLocation).toBeCalled()

		const listFunction = mockListing.mock.calls[0][3]
		await expect(listFunction()).resolves.toBe(roomList)
	})

	it('calls correct get endpoint when room id is found', async () => {
		const roomId = uuid()
		const locationId = uuid()
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
		expect(mockListing).toBeCalledWith(
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

		const getFunction = mockListing.mock.calls[0][4]

		await expect(getFunction(roomId)).resolves.not.toThrow()
		expect(getSpy).toBeCalledWith(roomId, locationId)
	})

	it('throws error when room id is not found', async () => {
		const roomId = uuid()
		const locationId = uuid()
		const roomList: RoomWithLocation[] = [
			{
				locationId: locationId,
				roomId: uuid(),
				locationName: 'test',
			},
		]
		mockGetRoomsByLocation.mockResolvedValueOnce(roomList)

		await expect(RoomsCommand.run([roomId])).resolves.not.toThrow()

		expect(mockGetRoomsByLocation).toBeCalledWith(expect.any(SmartThingsClient), undefined)
		expect(mockListing).toBeCalledWith(
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

		const getFunction = mockListing.mock.calls[0][4]

		await expect(getFunction(roomId)).rejects.toThrow('could not find room')
	})

	it('takes a specific locationId to query via flags', async () => {
		let locationId = uuid()

		await expect(RoomsCommand.run([`--location-id=${locationId}`])).resolves.not.toThrow()

		expect(mockGetRoomsByLocation).toBeCalledWith(expect.any(SmartThingsClient), locationId)
		mockGetRoomsByLocation.mockClear()

		locationId = uuid()

		await expect(RoomsCommand.run([`-l=${locationId}`])).resolves.not.toThrow()
		expect(mockGetRoomsByLocation).toBeCalledWith(expect.any(SmartThingsClient), locationId)
	})
})
