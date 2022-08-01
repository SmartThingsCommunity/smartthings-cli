import {
	buildOutputFormatter,
	calculateOutputFormat,
	IOFormat,
	jsonFormatter,
	writeOutput,
} from '@smartthings/cli-lib'
import { DeviceActivity, HistoryEndpoint, PaginatedList } from '@smartthings/core-sdk'
import LocationHistoryCommand from '../../../commands/locations/history'
import { writeDeviceEventsTable } from '../../../lib/commands/history-util'
import { chooseLocation } from '../../../commands/locations'


jest.mock('../../../lib/commands/history-util')
jest.mock('../../../commands/locations')

describe('LocationHistoryCommand', () => {
	const mockChooseLocation = jest.mocked(chooseLocation).mockResolvedValue('locationId')
	const historySpy = jest.spyOn(HistoryEndpoint.prototype, 'devices').mockImplementation()
	const calculateOutputFormatMock = jest.mocked(calculateOutputFormat).mockReturnValue(IOFormat.COMMON)
	const writeDeviceEventsTableMock = jest.mocked(writeDeviceEventsTable)

	it('queries history and writes event table interactively', async () => {
		historySpy.mockResolvedValueOnce({
			items: [],
			hasNext: (): boolean => false,
		} as unknown as PaginatedList<DeviceActivity>)

		await expect(LocationHistoryCommand.run(['locationId'])).resolves.not.toThrow()

		expect(mockChooseLocation).toBeCalledTimes(1)
		expect(historySpy).toBeCalledTimes(1)
		expect(historySpy).toBeCalledWith({
			locationId: 'locationId',
		})
		expect(writeDeviceEventsTableMock).toBeCalledTimes(1)
	})

	it('queries history and write event table directly', async () => {
		const buildOutputFormatterMock = jest.mocked(buildOutputFormatter)
		const writeOutputMock = jest.mocked(writeOutput)

		historySpy.mockResolvedValueOnce({
			items: [],
			hasNext: (): boolean => false,
		} as unknown as PaginatedList<DeviceActivity>)
		calculateOutputFormatMock.mockReturnValue(IOFormat.JSON)
		buildOutputFormatterMock.mockReturnValue(jsonFormatter(4))

		await expect(LocationHistoryCommand.run(['locationId'])).resolves.not.toThrow()

		expect(mockChooseLocation).toBeCalledTimes(1)
		expect(historySpy).toBeCalledTimes(1)
		expect(historySpy).toBeCalledWith({
			locationId: 'locationId',
		})
		expect(writeDeviceEventsTableMock).toBeCalledTimes(0)
		expect(buildOutputFormatterMock).toBeCalledTimes(1)
		expect(writeOutputMock).toBeCalledTimes(1)
	})
})
