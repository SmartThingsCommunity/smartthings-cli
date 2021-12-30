import { Room, RoomRequest, RoomsEndpoint } from '@smartthings/core-sdk'
import { ActionFunction, CommonOutputProducer, inputAndOutputItem, SmartThingsCommandInterface } from '@smartthings/cli-lib'
import { v4 as uuid } from 'uuid'
import RoomsUpdateCommand from '../../../../commands/locations/rooms/update'
import { chooseRoom } from '../../../../lib/commands/locations/rooms/rooms-util'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		inputAndOutputItem: jest.fn(),
	}
})

jest.mock('../../../../lib/commands/locations/rooms/rooms-util')

describe('RoomsUpdateCommand', () => {
	const mockInputOutput = inputAndOutputItem as unknown as
		jest.Mock<Promise<void>, [
			SmartThingsCommandInterface,
			CommonOutputProducer<Room>,
			ActionFunction<void, RoomRequest, Room>
		]>
	const mockChooseRoom = chooseRoom as jest.Mock

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('prompts user to choose room', async () => {
		mockChooseRoom.mockResolvedValueOnce([uuid(), uuid()])

		await expect(RoomsUpdateCommand.run([])).resolves.not.toThrow()

		expect(mockChooseRoom).toBeCalledWith(expect.any(RoomsUpdateCommand), undefined, undefined)
	})

	it('passes roomId on to chooseRoom', async () => {
		const roomId = uuid()

		mockChooseRoom.mockResolvedValueOnce([roomId, uuid()])

		await expect(RoomsUpdateCommand.run([roomId])).resolves.not.toThrow()

		expect(mockChooseRoom).toBeCalledWith(expect.any(RoomsUpdateCommand), undefined, roomId)
	})

	it('uses correct endpoint to update room', async () => {
		const roomId = uuid()
		const locationId = uuid()
		mockChooseRoom.mockResolvedValueOnce([roomId, locationId])

		const update: RoomRequest = { name: 'test' }
		mockInputOutput.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, update)
		})

		const updateSpy = jest.spyOn(RoomsEndpoint.prototype, 'update').mockImplementation()

		await expect(RoomsUpdateCommand.run([])).resolves.not.toThrow()

		expect(mockChooseRoom).toBeCalledWith(expect.any(RoomsUpdateCommand), undefined, undefined)
		expect(mockInputOutput).toBeCalledWith(
			expect.any(RoomsUpdateCommand),
			expect.anything(),
			expect.any(Function),
		)
		expect(updateSpy).toBeCalledWith(roomId, update, locationId)
	})

	it('takes a specific locationId to query via flags', async () => {
		// return value not important for this test
		mockChooseRoom.mockResolvedValue([uuid(), uuid()])

		let locationId = uuid()

		await expect(RoomsUpdateCommand.run([`--location-id=${locationId}`])).resolves.not.toThrow()

		expect(mockChooseRoom).toBeCalledWith(expect.any(RoomsUpdateCommand), locationId, undefined)
		mockChooseRoom.mockClear()

		const roomId = uuid()
		locationId = uuid()

		await expect(RoomsUpdateCommand.run([roomId, `-l=${locationId}`])).resolves.not.toThrow()
		expect(mockChooseRoom).toBeCalledWith(expect.any(RoomsUpdateCommand), locationId, roomId)
	})
})
