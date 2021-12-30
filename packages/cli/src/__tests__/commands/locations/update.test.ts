import { LocationsEndpoint, LocationUpdate } from '@smartthings/core-sdk'
import LocationsUpdateCommand from '../../../commands/locations/update'
import { inputAndOutputItem } from '@smartthings/cli-lib'
import { v4 as uuid } from 'uuid'
import { chooseLocation } from '../../../commands/locations'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		inputAndOutputItem: jest.fn(),
	}
})

jest.mock('../../../commands/locations', () => ({
	chooseLocation: jest.fn(async (_command, locationFromArg?) => {
		// simulate user choice
		const id = locationFromArg ?? uuid()
		return Promise.resolve(id)
	}),
}))

describe('LocationsUpdateCommand', () => {
	const mockInputOutput = inputAndOutputItem as unknown as jest.Mock

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('prompts user to choose location', async () => {
		await expect(LocationsUpdateCommand.run([])).resolves.not.toThrow()

		expect(chooseLocation).toBeCalledWith(expect.any(LocationsUpdateCommand), undefined)
	})

	it('uses correct endpoint to update location', async () => {
		const update: LocationUpdate = { name: 'test', temperatureScale: 'C' }

		mockInputOutput.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, update)
		})

		const updateSpy = jest.spyOn(LocationsEndpoint.prototype, 'update').mockImplementation()

		const locationId = uuid()
		await expect(LocationsUpdateCommand.run([locationId])).resolves.not.toThrow()

		expect(chooseLocation).toBeCalledWith(expect.any(LocationsUpdateCommand), locationId)
		expect(mockInputOutput).toBeCalledWith(
			expect.any(LocationsUpdateCommand),
			expect.anything(),
			expect.any(Function),
		)
		expect(updateSpy).toBeCalledWith(locationId, update)
	})
})
