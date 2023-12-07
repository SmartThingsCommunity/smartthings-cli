import {
	buildOutputFormatter,
	calculateOutputFormat,
	chooseDevice,
	IOFormat,
	writeOutput,
} from '@smartthings/cli-lib'
import { Device, DeviceActivity, DevicesEndpoint, HistoryEndpoint, PaginatedList, SmartThingsClient } from '@smartthings/core-sdk'
import DeviceHistoryCommand from '../../../commands/devices/history.js'
import { calculateRequestLimit, getHistory, writeDeviceEventsTable } from '../../../lib/commands/history-util.js'


jest.mock('../../../lib/commands/history-util')

describe('DeviceHistoryCommand', () => {
	const chooseDeviceMock = jest.mocked(chooseDevice).mockResolvedValue('deviceId')
	const getDeviceSpy = jest.spyOn(DevicesEndpoint.prototype, 'get').mockImplementation()
	const historySpy = jest.spyOn(HistoryEndpoint.prototype, 'devices').mockImplementation()
	const calculateOutputFormatMock = jest.mocked(calculateOutputFormat).mockReturnValue('common')
	const writeDeviceEventsTableMock = jest.mocked(writeDeviceEventsTable)
	const calculateRequestLimitMock = jest.mocked(calculateRequestLimit)
	const getHistoryMock = jest.mocked(getHistory)

	it('queries history and writes event table interactively', async () => {
		getDeviceSpy.mockResolvedValueOnce({ locationId: 'locationId' } as Device)
		historySpy.mockResolvedValueOnce({
			items: [],
			hasNext: (): boolean => false,
		} as unknown as PaginatedList<DeviceActivity>)

		await expect(DeviceHistoryCommand.run(['deviceId'])).resolves.not.toThrow()

		expect(calculateRequestLimitMock).toHaveBeenCalledTimes(1)
		expect(calculateRequestLimitMock).toHaveBeenCalledWith(20)
		expect(chooseDeviceMock).toHaveBeenCalledTimes(1)
		expect(chooseDeviceMock).toHaveBeenCalledWith(expect.any(DeviceHistoryCommand), 'deviceId', { allowIndex: true })
		expect(getDeviceSpy).toHaveBeenCalledTimes(1)
		expect(getDeviceSpy).toHaveBeenCalledWith('deviceId')
		expect(calculateOutputFormatMock).toHaveBeenCalledTimes(1)
		expect(historySpy).toHaveBeenCalledTimes(1)
		expect(historySpy).toHaveBeenCalledWith({
			deviceId: 'deviceId',
			locationId: 'locationId',
		})
		expect(writeDeviceEventsTableMock).toHaveBeenCalledTimes(1)
	})

	it('writes non-table output when specified', async () => {
		const outputFormatterMock = jest.fn().mockReturnValueOnce('formatted output')
		const buildOutputFormatterMock = jest.mocked(buildOutputFormatter<DeviceActivity[]>)
		const writeOutputMock = jest.mocked(writeOutput)

		const items = [{ deviceId: 'device-1' }] as DeviceActivity[]

		calculateRequestLimitMock.mockReturnValueOnce(20)
		getDeviceSpy.mockResolvedValueOnce({ locationId: 'locationId' } as Device)
		calculateOutputFormatMock.mockReturnValueOnce('json')
		buildOutputFormatterMock.mockReturnValueOnce(outputFormatterMock)
		getHistoryMock.mockResolvedValueOnce(items)

		await expect(DeviceHistoryCommand.run(['deviceId'])).resolves.not.toThrow()

		expect(calculateRequestLimitMock).toHaveBeenCalledTimes(1)
		expect(calculateRequestLimitMock).toHaveBeenCalledWith(20)
		expect(chooseDeviceMock).toHaveBeenCalledTimes(1)
		expect(chooseDeviceMock).toHaveBeenCalledWith(expect.any(DeviceHistoryCommand), 'deviceId', { allowIndex: true })
		expect(getDeviceSpy).toHaveBeenCalledTimes(1)
		expect(getDeviceSpy).toHaveBeenCalledWith('deviceId')
		expect(calculateOutputFormatMock).toHaveBeenCalledTimes(1)
		expect(getHistoryMock).toHaveBeenCalledTimes(1)
		expect(getHistoryMock).toHaveBeenCalledWith(
			expect.any(SmartThingsClient),
			20,
			20,
			expect.objectContaining({
				deviceId: 'deviceId',
				locationId: 'locationId',
			}),
		)
		expect(buildOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(outputFormatterMock).toHaveBeenCalledTimes(1)
		expect(outputFormatterMock).toHaveBeenCalledWith(items)
		expect(writeOutputMock).toHaveBeenCalledTimes(1)
		expect(writeOutputMock).toHaveBeenCalledWith('formatted output', undefined)

		expect(historySpy).toHaveBeenCalledTimes(0)
		expect(writeDeviceEventsTableMock).toHaveBeenCalledTimes(0)
	})
})
