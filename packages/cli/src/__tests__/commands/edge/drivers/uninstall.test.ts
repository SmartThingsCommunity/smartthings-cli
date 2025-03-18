import { HubdevicesEndpoint } from '@smartthings/core-sdk'

import DriversUninstallCommand from '../../../../commands/edge/drivers/uninstall'
import { chooseHub, chooseInstalledDriver } from '../../../../lib/commands/drivers-util'


jest.mock('../../../../../src/lib/commands/drivers-util')

// ignore console output
jest.spyOn(process.stdout, 'write').mockImplementation(() => true)

describe('DriversUninstallCommand', () => {
	const chooseHubMock = jest.mocked(chooseHub)
	const chooseInstalledDriverMock = jest.mocked(chooseInstalledDriver)
	const apiUninstallDriverSpy = jest.spyOn(HubdevicesEndpoint.prototype, 'uninstallDriver')

	it('prompts user with list of installed drivers', async () => {
		chooseHubMock.mockResolvedValue('chosen-hub-id')
		chooseInstalledDriverMock.mockResolvedValueOnce('chosen-driver-id')
		apiUninstallDriverSpy.mockImplementationOnce(() => Promise.resolve())

		await expect(DriversUninstallCommand.run([])).resolves.not.toThrow()

		expect(chooseHubMock).toHaveBeenCalledTimes(1)
		expect(chooseHubMock).toHaveBeenCalledWith(expect.any(DriversUninstallCommand),
			'Select a hub to uninstall from.', undefined, { useConfigDefault: true })
		expect(chooseInstalledDriver).toHaveBeenCalledTimes(1)
		expect(chooseInstalledDriver).toHaveBeenCalledWith( expect.any(DriversUninstallCommand),
			'chosen-hub-id', 'Select a driver to uninstall.', undefined)
		expect(apiUninstallDriverSpy).toHaveBeenCalledTimes(1)
		expect(apiUninstallDriverSpy).toHaveBeenCalledWith('chosen-driver-id', 'chosen-hub-id')
	})
})
