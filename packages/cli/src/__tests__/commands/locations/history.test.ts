import {
	buildOutputFormatter,
	calculateOutputFormat,
	IOFormat,
	jsonFormatter,
	writeOutput,
} from '@smartthings/cli-lib'
import { DeviceActivity, HistoryEndpoint, PaginatedList, SmartThingsClient } from '@smartthings/core-sdk'
import LocationHistoryCommand from '../../../commands/locations/history'
import { calculateRequestLimit, getHistory, writeDeviceEventsTable } from '../../../lib/commands/history-util'
import { chooseLocation } from '../../../commands/locations'


jest.mock('../../../lib/commands/history-util')
jest.mock('../../../commands/locations')

describe('LocationHistoryCommand', () => {
	const mockChooseLocation = jest.mocked(chooseLocation).mockResolvedValue('locationId')
	const historySpy = jest.spyOn(HistoryEndpoint.prototype, 'devices').mockImplementation()
	const calculateOutputFormatMock = jest.mocked(calculateOutputFormat).mockReturnValue(IOFormat.COMMON)
	const writeDeviceEventsTableMock = jest.mocked(writeDeviceEventsTable)
	const calculateHistoryRequestLimitMock = jest.mocked(calculateRequestLimit)
	const getHistoryMock = jest.mocked(getHistory)

	it('queries history and writes event table interactively', async () => {
		historySpy.mockResolvedValueOnce({
			items: [],
			hasNext: (): boolean => false,
		} as unknown as PaginatedList<DeviceActivity>)

		await expect(LocationHistoryCommand.run(['locationId'])).resolves.not.toThrow()

		expect(mockChooseLocation).toHaveBeenCalledTimes(1)
		expect(calculateOutputFormatMock).toHaveBeenCalledTimes(1)
		expect(historySpy).toHaveBeenCalledTimes(1)
		expect(historySpy).toHaveBeenCalledWith({
			locationId: 'locationId',
			limit: 20,
		})
		expect(writeDeviceEventsTableMock).toHaveBeenCalledTimes(1)
	})

	it('queries history and write event table directly', async () => {
		const buildOutputFormatterMock = jest.mocked(buildOutputFormatter)
		const writeOutputMock = jest.mocked(writeOutput)

		calculateHistoryRequestLimitMock.mockReturnValueOnce(20)
		calculateOutputFormatMock.mockReturnValueOnce(IOFormat.JSON)
		buildOutputFormatterMock.mockReturnValueOnce(jsonFormatter(4))

		await expect(LocationHistoryCommand.run(['locationId'])).resolves.not.toThrow()

		expect(calculateHistoryRequestLimitMock).toHaveBeenCalledTimes(1)
		expect(calculateHistoryRequestLimitMock).toHaveBeenCalledWith(20)
		expect(mockChooseLocation).toHaveBeenCalledTimes(1)
		expect(calculateOutputFormatMock).toHaveBeenCalledTimes(1)
		expect(getHistoryMock).toHaveBeenCalledTimes(1)
		expect(getHistoryMock).toHaveBeenCalledWith(
			expect.any(SmartThingsClient),
			20,
			20,
			expect.objectContaining({
				locationId: 'locationId',
			}),
		)
		expect(writeDeviceEventsTableMock).toHaveBeenCalledTimes(0)
		expect(buildOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(writeOutputMock).toHaveBeenCalledTimes(1)

		expect(historySpy).toHaveBeenCalledTimes(0)
		expect(writeDeviceEventsTableMock).toHaveBeenCalledTimes(0)
	})
})
