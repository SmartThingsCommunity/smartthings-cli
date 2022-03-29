import { outputListing } from '@smartthings/cli-lib'

import DeviceProfilesCommand from '../../commands/deviceprofiles'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		outputListing: jest.fn(),
	}
})

describe('DevicesProfilesCommand', () => {
	const outputListingMock = jest.mocked(outputListing)

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('uses simple fields by default', async () => {
		await expect(DeviceProfilesCommand.run([])).resolves.not.toThrow()

		expect(outputListingMock).toHaveBeenCalledTimes(1)
		expect(outputListingMock.mock.calls[0][1].listTableFieldDefinitions)
			.toEqual(['name', 'status', 'id'])
	})

	it('includes organization with all-organizations flag', async () => {
		await expect(DeviceProfilesCommand.run(['--all-organizations'])).resolves.not.toThrow()

		expect(outputListingMock).toHaveBeenCalledTimes(1)
		expect(outputListingMock.mock.calls[0][1].listTableFieldDefinitions)
			.toEqual(['name', 'status', 'id', 'organization'])
	})
})
