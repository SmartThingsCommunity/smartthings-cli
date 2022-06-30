import { RoomsEndpoint } from '@smartthings/core-sdk'
import RoomsDeleteCommand from '../../../../commands/locations/rooms/delete'
import { chooseRoom } from '../../../../lib/commands/locations/rooms-util'


jest.mock('../../../../lib/commands/locations/rooms-util')

describe('RoomsDeleteCommand', () => {
	const roomId = 'roomId'
	const locationId = 'locationId'
	const deleteSpy = jest.spyOn(RoomsEndpoint.prototype, 'delete').mockImplementation()
	const logSpy = jest.spyOn(RoomsDeleteCommand.prototype, 'log').mockImplementation()
	const mockChooseRoom = jest.mocked(chooseRoom).mockResolvedValue([roomId, locationId])

	it('prompts user to choose room', async () => {
		await expect(RoomsDeleteCommand.run([])).resolves.not.toThrow()

		expect(chooseRoom).toBeCalledWith(expect.any(RoomsDeleteCommand), undefined, undefined)
	})

	it('passes roomId on to chooseRoom', async () => {
		await expect(RoomsDeleteCommand.run([roomId])).resolves.not.toThrow()

		expect(mockChooseRoom).toBeCalledWith(expect.any(RoomsDeleteCommand), undefined, roomId)
	})

	it('uses correct endpoint to delete location', async () => {
		await expect(RoomsDeleteCommand.run([])).resolves.not.toThrow()

		expect(chooseRoom).toBeCalledWith(expect.any(RoomsDeleteCommand), undefined, undefined)
		expect(deleteSpy).toBeCalledWith(roomId, locationId)
		expect(logSpy).toBeCalledWith(expect.stringContaining(`${roomId} deleted`))
	})

	it('takes a specific locationId to query via flags', async () => {
		await expect(RoomsDeleteCommand.run([`--location-id=${locationId}`])).resolves.not.toThrow()

		expect(mockChooseRoom).toBeCalledWith(expect.any(RoomsDeleteCommand), locationId, undefined)
		mockChooseRoom.mockClear()

		await expect(RoomsDeleteCommand.run([roomId, `-l=${locationId}`])).resolves.not.toThrow()
		expect(mockChooseRoom).toBeCalledWith(expect.any(RoomsDeleteCommand), locationId, roomId)
	})
})
