import { RoomsEndpoint } from '@smartthings/core-sdk'
import RoomsDeleteCommand from '../../../../commands/locations/rooms/delete'
import { v4 as uuid } from 'uuid'
import { chooseRoom } from '../../../../lib/commands/locations/rooms/rooms-util'
import { APICommand } from '@smartthings/cli-lib'


jest.mock('../../../../lib/commands/locations/rooms/rooms-util')

describe('RoomsDeleteCommand', () => {
	const deleteSpy = jest.spyOn(RoomsEndpoint.prototype, 'delete').mockImplementation()
	const logSpy = jest.spyOn(RoomsDeleteCommand.prototype, 'log').mockImplementation()
	const mockChooseRoom = chooseRoom as
		jest.Mock<Promise<[string, string]>, [APICommand, string | undefined, string | undefined]>

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('prompts user to choose room', async () => {
		mockChooseRoom.mockResolvedValueOnce([uuid(), uuid()])

		await expect(RoomsDeleteCommand.run()).resolves.not.toThrow()

		expect(chooseRoom).toBeCalledWith(expect.any(RoomsDeleteCommand), undefined, undefined)
	})

	it('passes roomId on to chooseRoom', async () => {
		const roomId = uuid()

		mockChooseRoom.mockResolvedValueOnce([roomId, uuid()])

		await expect(RoomsDeleteCommand.run([roomId])).resolves.not.toThrow()

		expect(mockChooseRoom).toBeCalledWith(expect.any(RoomsDeleteCommand), undefined, roomId)
	})

	it('uses correct endpoint to delete location', async () => {
		const roomId = uuid()
		const locationId = uuid()
		mockChooseRoom.mockResolvedValueOnce([roomId, locationId])

		await expect(RoomsDeleteCommand.run()).resolves.not.toThrow()

		expect(chooseRoom).toBeCalledWith(expect.any(RoomsDeleteCommand), undefined, undefined)
		expect(deleteSpy).toBeCalledWith(roomId, locationId)
		expect(logSpy).toBeCalledWith(expect.stringContaining(`${roomId} deleted`))
	})

	it('takes a specific locationId to query via flags', async () => {
		// return value not important for this test
		mockChooseRoom.mockResolvedValue([uuid(), uuid()])

		let locationId = uuid()

		await expect(RoomsDeleteCommand.run([`--location-id=${locationId}`])).resolves.not.toThrow()

		expect(mockChooseRoom).toBeCalledWith(expect.any(RoomsDeleteCommand), locationId, undefined)
		mockChooseRoom.mockClear()

		const roomId = uuid()
		locationId = uuid()

		await expect(RoomsDeleteCommand.run([roomId, `-l=${locationId}`])).resolves.not.toThrow()
		expect(mockChooseRoom).toBeCalledWith(expect.any(RoomsDeleteCommand), locationId, roomId)
	})
})
