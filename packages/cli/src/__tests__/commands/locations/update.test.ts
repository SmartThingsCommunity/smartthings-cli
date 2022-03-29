import { LocationsEndpoint, LocationUpdate } from '@smartthings/core-sdk'
import LocationsUpdateCommand from '../../../commands/locations/update'
import { inputAndOutputItem } from '@smartthings/cli-lib'
import { chooseLocation } from '../../../commands/locations'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		inputAndOutputItem: jest.fn(),
	}
})

jest.mock('../../../commands/locations')

describe('LocationsUpdateCommand', () => {
	const locationId = 'locationId'
	const mockInputAndOutputItem = jest.mocked(inputAndOutputItem)
	const mockChooseLocation = jest.mocked(chooseLocation).mockResolvedValue(locationId)

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('prompts user to choose location', async () => {
		await expect(LocationsUpdateCommand.run([])).resolves.not.toThrow()

		expect(mockChooseLocation).toBeCalledWith(expect.any(LocationsUpdateCommand), undefined)
	})

	it('uses correct endpoint to update location', async () => {
		const update: LocationUpdate = { name: 'test', temperatureScale: 'C' }

		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, update)
		})

		const updateSpy = jest.spyOn(LocationsEndpoint.prototype, 'update').mockImplementation()

		await expect(LocationsUpdateCommand.run([locationId])).resolves.not.toThrow()

		expect(mockChooseLocation).toBeCalledWith(expect.any(LocationsUpdateCommand), locationId)
		expect(mockInputAndOutputItem).toBeCalledWith(
			expect.any(LocationsUpdateCommand),
			expect.anything(),
			expect.any(Function),
		)
		expect(updateSpy).toBeCalledWith(locationId, update)
	})
})
