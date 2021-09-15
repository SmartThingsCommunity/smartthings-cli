import { LocationsEndpoint } from '@smartthings/core-sdk'
import LocationsDeleteCommand from '../../../commands/locations/delete'
import { v4 as uuid } from 'uuid'
import { chooseLocation } from '../../../commands/locations'


jest.mock('../../../commands/locations', () => ({
	chooseLocation: jest.fn(async (_command, locationFromArg?) => {
		// simulate user choice
		const id = locationFromArg ?? uuid()
		return Promise.resolve(id)
	}),
}))

describe('LocationsDeleteCommand', () => {
	const deleteSpy = jest.spyOn(LocationsEndpoint.prototype, 'delete').mockImplementation()
	const logSpy = jest.spyOn(LocationsDeleteCommand.prototype, 'log').mockImplementation()

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('prompts user to choose location', async () => {
		await expect(LocationsDeleteCommand.run()).resolves.not.toThrow()

		expect(chooseLocation).toBeCalledWith(expect.any(LocationsDeleteCommand), undefined)
	})

	it('uses correct endpoint to delete location', async () => {
		const locationId = uuid()
		await expect(LocationsDeleteCommand.run([locationId])).resolves.not.toThrow()

		expect(chooseLocation).toBeCalledWith(expect.any(LocationsDeleteCommand), locationId)
		expect(deleteSpy).toBeCalledWith(locationId)
		expect(logSpy).toBeCalledWith(expect.stringContaining(`${locationId} deleted`))
	})
})
