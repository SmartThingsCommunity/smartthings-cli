import { inputAndOutputItem } from '@smartthings/cli-lib'
import LocationsCreateCommand from '../../../commands/locations/create'
import { LocationsEndpoint } from '@smartthings/core-sdk'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		inputAndOutputItem: jest.fn(),
	}
})

describe('LocationsCreateCommand', () => {
	const mockInputOutput = inputAndOutputItem as unknown as jest.Mock

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('uses correct endpoint to create location', async () => {
		mockInputOutput.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction()
		})

		const createSpy = jest.spyOn(LocationsEndpoint.prototype, 'create').mockImplementation()

		await expect(LocationsCreateCommand.run()).resolves.not.toThrow()

		expect(mockInputOutput).toBeCalledWith(
			expect.any(LocationsCreateCommand),
			expect.anything(),
			expect.any(Function),
		)

		expect(createSpy).toBeCalledTimes(1)
	})
})
