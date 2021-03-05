import { outputListing } from '@smartthings/cli-lib'

import DevicesCommand from '../../commands/devices'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		outputListing: jest.fn(),
	}
})

describe('devices', () => {
	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('DevicesCommand', () => {
		const outputListingMock = outputListing as unknown as jest.Mock<typeof outputListing>

		it('passes undefined for location id when not specified', async () => {
			await expect(DevicesCommand.run()).resolves.not.toThrow()

			expect(outputListingMock).toHaveBeenCalledTimes(1)
			expect(outputListingMock.mock.calls[0][2]).toBeUndefined()
		})

		it('passes argument as location id', async () => {
			await expect(DevicesCommand.run(['location-id'])).resolves.not.toThrow()

			expect(outputListingMock).toHaveBeenCalledTimes(1)
			expect(outputListingMock.mock.calls[0][2]).toBe('location-id')
		})

		it('uses simple fields by default', async () => {
			await expect(DevicesCommand.run([])).resolves.not.toThrow()

			expect(outputListingMock).toHaveBeenCalledTimes(1)
			expect(outputListingMock.mock.calls[0][1].listTableFieldDefinitions)
				.toEqual(['label', 'name', 'type', 'deviceId'])
		})

		it('includes location and room with verbose flag', async () => {
			await expect(DevicesCommand.run(['--verbose'])).resolves.not.toThrow()

			expect(outputListingMock).toHaveBeenCalledTimes(1)
			expect(outputListingMock.mock.calls[0][1].listTableFieldDefinitions)
				.toEqual(['label', 'name', 'type', 'location', 'room', 'deviceId'])
		})
	})
})
