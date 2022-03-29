import { LocationsEndpoint } from '@smartthings/core-sdk'
import LocationsDeleteCommand from '../../../commands/locations/delete'
import { chooseLocation } from '../../../commands/locations'


jest.mock('../../../commands/locations')

describe('LocationsDeleteCommand', () => {
	const locationId = 'locationId'
	const mockChooseLocation = jest.mocked(chooseLocation).mockResolvedValue(locationId)
	const deleteSpy = jest.spyOn(LocationsEndpoint.prototype, 'delete').mockImplementation()
	const logSpy = jest.spyOn(LocationsDeleteCommand.prototype, 'log').mockImplementation()

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('prompts user to choose location', async () => {
		await expect(LocationsDeleteCommand.run([])).resolves.not.toThrow()

		expect(mockChooseLocation).toBeCalledWith(expect.any(LocationsDeleteCommand), undefined)
	})

	it('uses correct endpoint to delete location', async () => {
		await expect(LocationsDeleteCommand.run([locationId])).resolves.not.toThrow()

		expect(mockChooseLocation).toBeCalledWith(expect.any(LocationsDeleteCommand), locationId)
		expect(deleteSpy).toBeCalledWith(locationId)
		expect(logSpy).toBeCalledWith(expect.stringContaining(`${locationId} deleted`))
	})
})
