import { RoomRequest, RoomsEndpoint } from '@smartthings/core-sdk'
import { inputAndOutputItem } from '@smartthings/cli-lib'
import RoomsUpdateCommand from '../../../../commands/locations/rooms/update'
import { chooseRoom } from '../../../../lib/commands/locations/rooms-util'


jest.mock('../../../../lib/commands/locations/rooms-util')

describe('RoomsUpdateCommand', () => {
	const roomId = 'roomId'
	const locationId = 'locationId'
	const mockInputAndOutputItem = jest.mocked(inputAndOutputItem)
	const mockChooseRoom = jest.mocked(chooseRoom).mockResolvedValue([roomId, locationId])

	it('prompts user to choose room', async () => {
		await expect(RoomsUpdateCommand.run([])).resolves.not.toThrow()

		expect(mockChooseRoom).toBeCalledWith(expect.any(RoomsUpdateCommand), undefined, undefined)
	})

	it('passes roomId on to chooseRoom', async () => {
		await expect(RoomsUpdateCommand.run([roomId])).resolves.not.toThrow()

		expect(mockChooseRoom).toBeCalledWith(expect.any(RoomsUpdateCommand), undefined, roomId)
	})

	it('uses correct endpoint to update room', async () => {
		const update: RoomRequest = { name: 'test' }
		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, update)
		})

		const updateSpy = jest.spyOn(RoomsEndpoint.prototype, 'update').mockImplementation()

		await expect(RoomsUpdateCommand.run([])).resolves.not.toThrow()

		expect(mockChooseRoom).toBeCalledWith(expect.any(RoomsUpdateCommand), undefined, undefined)
		expect(mockInputAndOutputItem).toBeCalledWith(
			expect.any(RoomsUpdateCommand),
			expect.anything(),
			expect.any(Function),
		)
		expect(updateSpy).toBeCalledWith(roomId, update, locationId)
	})

	it('takes a specific locationId to query via flags', async () => {
		await expect(RoomsUpdateCommand.run([`--location-id=${locationId}`])).resolves.not.toThrow()

		expect(mockChooseRoom).toBeCalledWith(expect.any(RoomsUpdateCommand), locationId, undefined)
		mockChooseRoom.mockClear()

		await expect(RoomsUpdateCommand.run([roomId, `-l=${locationId}`])).resolves.not.toThrow()
		expect(mockChooseRoom).toBeCalledWith(expect.any(RoomsUpdateCommand), locationId, roomId)
	})
})
