import { DriversEndpoint } from '@smartthings/core-sdk'

import DriversDeleteCommand from '../../../../commands/edge/drivers/delete.js'
import { chooseDriver } from '../../../../lib/commands/drivers-util.js'


jest.mock('../../../../../src/lib/commands/drivers-util')

describe('DriversDeleteCommand', () => {
	const chooseDriverMock = jest.mocked(chooseDriver).mockResolvedValue('chosen-driver-id')
	const apiDriversDeleteSpy = jest.spyOn(DriversEndpoint.prototype, 'delete').mockImplementation()

	it('deletes driver', async () => {
		await expect(DriversDeleteCommand.run(['cmd-line-driver-id'])).resolves.not.toThrow()

		expect(chooseDriverMock).toHaveBeenCalledTimes(1)
		expect(chooseDriverMock).toHaveBeenCalledWith(expect.any(DriversDeleteCommand),
			'Select a driver to delete.', 'cmd-line-driver-id')

		expect(apiDriversDeleteSpy).toHaveBeenCalledTimes(1)
		expect(apiDriversDeleteSpy).toHaveBeenCalledWith('chosen-driver-id')
	})
})
