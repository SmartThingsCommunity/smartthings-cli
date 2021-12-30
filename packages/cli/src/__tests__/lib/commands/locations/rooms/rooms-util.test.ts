import { Location, LocationsEndpoint, NoOpAuthenticator, Room, RoomsEndpoint, SmartThingsClient } from '@smartthings/core-sdk'
import { getRoomsByLocation, chooseRoom } from '../../../../../lib/commands/locations/rooms/rooms-util'
import * as roomsUtil from '../../../../../lib/commands/locations/rooms/rooms-util'
import { v4 as uuid } from 'uuid'
import { Config } from '@oclif/core'
import { APICommand, selectFromList } from '@smartthings/cli-lib'


describe('getRoomsByLocation', () => {
	const testClient = new SmartThingsClient(new NoOpAuthenticator)
	const listRoomsSpy = jest.spyOn(RoomsEndpoint.prototype, 'list').mockImplementation()
	const getLocationsSpy = jest.spyOn(LocationsEndpoint.prototype, 'get').mockImplementation()
	const listLocationsSpy = jest.spyOn(LocationsEndpoint.prototype, 'list').mockImplementation()

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('throws error when no locations are found', async () => {
		listLocationsSpy.mockResolvedValueOnce([])
		const forbiddenError = new Error('Request failed with status code 403')
		getLocationsSpy.mockRejectedValueOnce(forbiddenError)

		await expect(getRoomsByLocation(testClient)).rejects.toThrow('could not find any locations')
		await expect(getRoomsByLocation(testClient, uuid())).rejects.toThrow(forbiddenError)
	})

	it('returns rooms with locationName added', async () => {
		const locationId = uuid()
		const roomId = uuid()
		const location: Location = {
			locationId: locationId,
			name: 'test',
			timeZoneId: '',
			backgroundImage: '',
			countryCode: '',
			temperatureScale: 'C',
		}
		const rooms: Room[] = [
			{
				locationId: locationId,
				roomId: roomId,
			},
		]

		getLocationsSpy.mockResolvedValueOnce(location)
		listRoomsSpy.mockResolvedValueOnce(rooms)

		const roomsWithLocations = await getRoomsByLocation(testClient, locationId)

		expect(roomsWithLocations[0]).toEqual(expect.objectContaining(rooms[0]))
		expect(roomsWithLocations[0].locationName).toBe(location.name)
	})
})

jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		APICommand: class {
			get client(): SmartThingsClient {
				return new SmartThingsClient(new NoOpAuthenticator)
			}
		},
		selectFromList: jest.fn(),
	}
})

describe('chooseRoom', () => {
	const getRoomsByLocationSpy = jest.spyOn(roomsUtil, 'getRoomsByLocation')
	class MockCommand extends APICommand {
		async run(): Promise<void> {
			// eslint-disable-line @typescript-eslint/no-empty-function
		}
	}
	const command = new MockCommand([], new Config({ root: '' }))
	const mockSelect = selectFromList as jest.Mock

	beforeAll(() => {
		mockSelect.mockResolvedValue(uuid())
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('throws error when room not found', async () => {
		const roomId = uuid()
		getRoomsByLocationSpy.mockResolvedValueOnce([])
		mockSelect.mockResolvedValueOnce(roomId)

		await expect(chooseRoom(command)).rejects.toThrow('could not find room')

		const roomsWithLocation = [{
			roomId: uuid(),
			locationId: uuid(),
			name: 'test',
		}]
		getRoomsByLocationSpy.mockResolvedValueOnce(roomsWithLocation)
		mockSelect.mockResolvedValueOnce(roomId)

		await expect(chooseRoom(command)).rejects.toThrow('could not find room')
	})

	it('throws error when locationId is missing', async () => {
		const roomId = uuid()
		const roomsWithLocation = [{
			roomId: roomId,
			name: 'test',
		}]
		getRoomsByLocationSpy.mockResolvedValueOnce(roomsWithLocation)
		mockSelect.mockResolvedValueOnce(roomId)

		await expect(chooseRoom(command)).rejects.toThrow('could not determine location id for room')
	})

	it('returns room tuple when room is found', async () => {
		const roomId = uuid()
		const locationId = uuid()
		const roomsWithLocation = [{
			roomId: roomId,
			locationId: locationId,
			name: 'test',
		}]

		getRoomsByLocationSpy.mockResolvedValueOnce(roomsWithLocation)
		mockSelect.mockResolvedValueOnce(roomId)

		await expect(chooseRoom(command, locationId)).resolves.toEqual([roomId, locationId])
	})

	it('calls selectFromList with correct config', async () => {
		getRoomsByLocationSpy.mockResolvedValueOnce([])
		const roomId = uuid()
		await expect(chooseRoom(command, undefined, roomId)).rejects.toThrow('could not find room')

		expect(mockSelect).toBeCalledWith(
			expect.anything(),
			expect.objectContaining({
				itemName: 'room',
				primaryKeyName: 'roomId',
				sortKeyName: 'name',
				listTableFieldDefinitions: expect.anything(),
			}),
			roomId,
			expect.any(Function),
		)
	})

	it('passes on locationId when retrieving rooms', async () => {
		getRoomsByLocationSpy.mockResolvedValue([])

		await expect(chooseRoom(command)).rejects.toThrow('could not find room')

		expect(getRoomsByLocationSpy).toBeCalledWith(expect.any(SmartThingsClient), undefined)

		getRoomsByLocationSpy.mockClear

		const locationId = uuid()
		await expect(chooseRoom(command, locationId)).rejects.toThrow('could not find room')

		expect(getRoomsByLocationSpy).toBeCalledWith(expect.any(SmartThingsClient), locationId)
	})
})
