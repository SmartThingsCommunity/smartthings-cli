import { inputAndOutputItem } from '@smartthings/cli-lib'
import LocationsCreateCommand from '../../../commands/locations/create'
import { LocationCreate, LocationsEndpoint } from '@smartthings/core-sdk'


const MOCK_LOCATION_CREATE = {} as LocationCreate

describe('LocationsCreateCommand', () => {
	const mockInputAndOutputItem = jest.mocked(inputAndOutputItem)

	it('uses correct endpoint to create location', async () => {
		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, MOCK_LOCATION_CREATE)
		})

		const createSpy = jest.spyOn(LocationsEndpoint.prototype, 'create').mockImplementation()

		await expect(LocationsCreateCommand.run([])).resolves.not.toThrow()

		expect(mockInputAndOutputItem).toBeCalledWith(
			expect.any(LocationsCreateCommand),
			expect.anything(),
			expect.any(Function),
		)

		expect(createSpy).toBeCalledTimes(1)
		expect(createSpy).toBeCalledWith(MOCK_LOCATION_CREATE)
	})
})
