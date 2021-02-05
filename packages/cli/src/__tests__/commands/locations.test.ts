import { v4 as uuidv4 } from 'uuid'
import { outputListing } from '@smartthings/cli-lib'
import LocationsCommand from '../../commands/locations'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		outputListing: jest.fn(),
	}
})

describe('LocationsCommand', () => {
	const mockListing = outputListing as unknown as jest.Mock<typeof outputListing>

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('calls outputListing when no id is provided', async () => {
		await expect(LocationsCommand.run()).resolves.not.toThrow()

		expect(mockListing).toBeCalledTimes(1)
		expect(mockListing.mock.calls[0][1]).toBeUndefined()
	})

	it('calls outputListing when id is provided', async () => {
		const locationId = uuidv4()
		await expect(LocationsCommand.run([locationId])).resolves.not.toThrow()

		expect(mockListing).toBeCalledTimes(1)
		expect(mockListing.mock.calls[0][1]).toBe(locationId)
	})
})
