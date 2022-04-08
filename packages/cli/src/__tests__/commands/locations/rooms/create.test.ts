import { inputAndOutputItem } from '@smartthings/cli-lib'
import { Room, RoomRequest, RoomsEndpoint } from '@smartthings/core-sdk'
import { chooseLocation } from '../../../../commands/locations'
import RoomsCreateCommand from '../../../../commands/locations/rooms/create'


jest.mock('../../../../commands/locations')

describe('RoomsCreateCommand', () => {
	const locationId = 'locationId'
	const mockInputAndOutputItem = jest.mocked(inputAndOutputItem)
	const mockChooseLocation = jest.mocked(chooseLocation)

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('uses correct endpoint to create room', async () => {
		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction) => {
			const room: RoomRequest = {}
			await actionFunction(undefined, room)
		})

		mockChooseLocation.mockResolvedValueOnce(locationId)

		const room: Room = { name: 'test' }
		const createSpy = jest.spyOn(RoomsEndpoint.prototype, 'create').mockResolvedValueOnce(room)

		await expect(RoomsCreateCommand.run([])).resolves.not.toThrow()

		expect(mockChooseLocation).toBeCalledWith(expect.any(RoomsCreateCommand), undefined)
		expect(mockInputAndOutputItem).toBeCalledWith(
			expect.any(RoomsCreateCommand),
			expect.anything(),
			expect.any(Function),
		)

		expect(createSpy).toBeCalledWith(expect.anything(), locationId)
	})

	it('takes a specific locationId to query via flags', async () => {
		await expect(RoomsCreateCommand.run([`--location-id=${locationId}`])).resolves.not.toThrow()

		expect(mockChooseLocation).toBeCalledWith(expect.any(RoomsCreateCommand), locationId)
		mockChooseLocation.mockClear()

		await expect(RoomsCreateCommand.run([`-l=${locationId}`])).resolves.not.toThrow()
		expect(mockChooseLocation).toBeCalledWith(expect.any(RoomsCreateCommand), locationId)
	})
})
