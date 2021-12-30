import { ActionFunction, CommonOutputProducer, inputAndOutputItem, SmartThingsCommandInterface } from '@smartthings/cli-lib'
import { Room, RoomRequest, RoomsEndpoint } from '@smartthings/core-sdk'
import { chooseLocation } from '../../../../commands/locations'
import RoomsCreateCommand from '../../../../commands/locations/rooms/create'
import { v4 as uuid } from 'uuid'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		inputAndOutputItem: jest.fn(),
	}
})

jest.mock('../../../../commands/locations')

describe('RoomsCreateCommand', () => {
	const mockInputOutput = inputAndOutputItem as unknown as
		jest.Mock<Promise<void>, [
			SmartThingsCommandInterface,
			CommonOutputProducer<Room>,
			ActionFunction<void, RoomRequest, Room>
		]>
	const mockChooseLocation = chooseLocation as
		jest.Mock

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('uses correct endpoint to create room', async () => {
		mockInputOutput.mockImplementationOnce(async (_command, _config, actionFunction: ActionFunction<void, RoomRequest, Room>) => {
			const room: RoomRequest = {}
			await actionFunction(undefined, room)
		})

		const locationId = uuid()

		mockChooseLocation.mockResolvedValueOnce(locationId)

		const room: Room = { name: 'test' }
		const createSpy = jest.spyOn(RoomsEndpoint.prototype, 'create').mockResolvedValueOnce(room)

		await expect(RoomsCreateCommand.run([])).resolves.not.toThrow()

		expect(mockChooseLocation).toBeCalledWith(expect.any(RoomsCreateCommand), undefined)
		expect(mockInputOutput).toBeCalledWith(
			expect.any(RoomsCreateCommand),
			expect.anything(),
			expect.any(Function),
		)

		expect(createSpy).toBeCalledWith(expect.anything(), locationId)
	})

	it('takes a specific locationId to query via flags', async () => {
		let locationId = uuid()

		await expect(RoomsCreateCommand.run([`--location-id=${locationId}`])).resolves.not.toThrow()

		expect(mockChooseLocation).toBeCalledWith(expect.any(RoomsCreateCommand), locationId)
		mockChooseLocation.mockClear()

		locationId = uuid()

		await expect(RoomsCreateCommand.run([`-l=${locationId}`])).resolves.not.toThrow()
		expect(mockChooseLocation).toBeCalledWith(expect.any(RoomsCreateCommand), locationId)
	})
})
