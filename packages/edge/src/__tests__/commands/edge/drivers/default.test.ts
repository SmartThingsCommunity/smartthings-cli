import { DriversEndpoint, EdgeDriverSummary } from '@smartthings/core-sdk'

import { outputItemOrList } from '@smartthings/cli-lib'

import DriversDefaultCommand from '../../../../commands/edge/drivers/default'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		outputItemOrList: jest.fn(),
	}
})
jest.mock('../../../../../src/lib/commands/drivers-util')

describe('DriversDefaultCommand', () => {
	const outputItemOrListMock = jest.mocked(outputItemOrList)

	it('uses outputItemOrList', async () => {
		await expect(DriversDefaultCommand.run([])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			expect.any(DriversDefaultCommand),
			expect.objectContaining({ primaryKeyName: 'driverId' }),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)
	})

	it('accepts index or ID', async () => {
		await expect(DriversDefaultCommand.run(['id'])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			expect.any(DriversDefaultCommand),
			expect.objectContaining({ primaryKeyName: 'driverId' }),
			'id',
			expect.any(Function),
			expect.any(Function),
		)
	})

	it('uses listDefaultDrivers to list drivers', async () => {
		await expect(DriversDefaultCommand.run([])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)

		const listFunction = outputItemOrListMock.mock.calls[0][3]

		const driverList = [{ driverId: 'driver-in-list-id' }] as EdgeDriverSummary[]
		const listDefaultSpy = jest.spyOn(DriversEndpoint.prototype, 'listDefault')
			.mockResolvedValueOnce(driverList)

		expect(await listFunction()).toBe(driverList)

		expect(listDefaultSpy).toHaveBeenCalledTimes(1)
		expect(listDefaultSpy).toHaveBeenCalledWith()
	})
})
