import { DriversEndpoint, EdgeDriver, SmartThingsClient } from '@smartthings/core-sdk'

import { CustomCommonOutputProducer, DefaultTableGenerator, outputItemOrList } from '@smartthings/cli-lib'

import DriversCommand from '../../../commands/edge/drivers.js'
import { buildTableOutput, listDrivers } from '../../../lib/commands/drivers-util.js'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		outputItemOrList: jest.fn(),
	}
})
jest.mock('../../../../src/lib/commands/drivers-util')

describe('DriversCommand', () => {
	const outputItemOrListMock = jest.mocked(outputItemOrList)

	it('uses outputItemOrList', async () => {
		await expect(DriversCommand.run([])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			expect.any(DriversCommand),
			expect.objectContaining({
				primaryKeyName: 'driverId',
				listTableFieldDefinitions: expect.not.arrayContaining(['organization']),
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)
	})

	it('includes organization in listing output', async () => {
		await expect(DriversCommand.run(['--all-organizations'])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			expect.any(DriversCommand),
			expect.objectContaining({
				primaryKeyName: 'driverId',
				listTableFieldDefinitions: expect.arrayContaining(['organization']),
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)
	})

	it('uses listDrivers to list drivers', async () => {
		await expect(DriversCommand.run(['--all-organizations'])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			expect.any(DriversCommand),
			expect.objectContaining({ primaryKeyName: 'driverId' }),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		const listFunction = outputItemOrListMock.mock.calls[0][3]

		const driverList = [{ driverId: 'driver-in-list-id' }] as EdgeDriver[]
		const listDriversMock = jest.mocked(listDrivers).mockResolvedValueOnce(driverList)

		expect(await listFunction()).toBe(driverList)

		expect(listDriversMock).toHaveBeenCalledTimes(1)
		expect(listDriversMock).toHaveBeenCalledWith(expect.any(SmartThingsClient), true)
	})

	test('get item function uses drivers.get with id', async () => {
		await expect(DriversCommand.run(['id-from-command-line'])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			expect.any(DriversCommand),
			expect.objectContaining({ primaryKeyName: 'driverId' }),
			'id-from-command-line',
			expect.any(Function),
			expect.any(Function),
		)

		const getFunction = outputItemOrListMock.mock.calls[0][4]

		const driver = { driverId: 'driver-id' } as EdgeDriver
		const getSpy = jest.spyOn(DriversEndpoint.prototype, 'get').mockResolvedValueOnce(driver)

		expect(await getFunction('resolved-driver-id')).toBe(driver)

		expect(getSpy).toHaveBeenCalledTimes(1)
		expect(getSpy).toHaveBeenCalledWith('resolved-driver-id')
	})

	test('get item function uses drivers.getRevision with id version flag', async () => {
		await expect(DriversCommand.run([
			'id-from-command-line',
			'--version=version-from-command-line',
		])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			expect.any(DriversCommand),
			expect.objectContaining({ primaryKeyName: 'driverId' }),
			'id-from-command-line',
			expect.any(Function),
			expect.any(Function),
		)

		const getFunction = outputItemOrListMock.mock.calls[0][4]

		const driver = { driverId: 'driver-id' } as EdgeDriver
		const getRevision = jest.spyOn(DriversEndpoint.prototype, 'getRevision').mockResolvedValueOnce(driver)

		expect(await getFunction('resolved-driver-id')).toBe(driver)

		expect(getRevision).toHaveBeenCalledTimes(1)
		expect(getRevision).toHaveBeenCalledWith('resolved-driver-id', 'version-from-command-line')
	})

	it('uses buildTableOutput from drivers-util', async () => {
		await expect(DriversCommand.run(['id-from-command-line'])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			expect.any(DriversCommand),
			expect.objectContaining({ primaryKeyName: 'driverId' }),
			'id-from-command-line',
			expect.any(Function),
			expect.any(Function),
		)

		const config = outputItemOrListMock.mock.calls[0][1] as CustomCommonOutputProducer<EdgeDriver>
		const driver = { driverId: 'driver-id' } as EdgeDriver

		const buildTableOutputMock = jest.mocked(buildTableOutput).mockReturnValueOnce('table output')

		expect(config.buildTableOutput(driver)).toBe('table output')

		expect(buildTableOutputMock).toHaveBeenCalledTimes(1)
		expect(buildTableOutputMock).toHaveBeenCalledWith(expect.any(DefaultTableGenerator), driver)
	})
})
