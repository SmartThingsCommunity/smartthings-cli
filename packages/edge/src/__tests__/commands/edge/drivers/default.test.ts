import { DriversEndpoint, EdgeDriverSummary } from '@smartthings/core-sdk'

import { outputList } from '@smartthings/cli-lib'

import DriversDefaultCommand from '../../../../commands/edge/drivers/default'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		outputList: jest.fn(),
	}
})
jest.mock('../../../../../src/lib/commands/drivers-util')

describe('DriversDefaultCommand', () => {
	const outputListMock = jest.mocked(outputList)

	it('uses outputList', async () => {
		await expect(DriversDefaultCommand.run([])).resolves.not.toThrow()

		expect(outputListMock).toHaveBeenCalledTimes(1)
		expect(outputListMock).toHaveBeenCalledWith(
			expect.any(DriversDefaultCommand),
			expect.objectContaining({ primaryKeyName: 'driverId' }),
			expect.any(Function),
		)
	})

	it('uses listDefaultDrivers to list drivers', async () => {
		await expect(DriversDefaultCommand.run([])).resolves.not.toThrow()

		expect(outputListMock).toHaveBeenCalledTimes(1)

		const listFunction = outputListMock.mock.calls[0][2]

		const driverList = [{ driverId: 'driver-in-list-id' }] as EdgeDriverSummary[]
		const listDefaultSpy = jest.spyOn(DriversEndpoint.prototype, 'listDefault')
			.mockResolvedValueOnce(driverList)

		expect(await listFunction()).toBe(driverList)

		expect(listDefaultSpy).toHaveBeenCalledTimes(1)
		expect(listDefaultSpy).toHaveBeenCalledWith()
	})
})
