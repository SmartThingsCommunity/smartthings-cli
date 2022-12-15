import {
	buildOutputFormatter,
	calculateOutputFormat,
	chooseDevice,
	IOFormat,
	jsonFormatter,
	writeOutput,
} from '@smartthings/cli-lib'
import { Device, DeviceActivity, DevicesEndpoint, HistoryEndpoint, PaginatedList, SmartThingsClient } from '@smartthings/core-sdk'
import DeviceHistoryCommand from '../../../commands/devices/history'
import { calculateRequestLimit, getHistory, writeDeviceEventsTable } from '../../../lib/commands/history-util'


jest.mock('../../../lib/commands/history-util')

describe('DeviceHistoryCommand', () => {
	const getDeviceSpy = jest.spyOn(DevicesEndpoint.prototype, 'get').mockImplementation()
	const historySpy = jest.spyOn(HistoryEndpoint.prototype, 'devices').mockImplementation()
	const deviceSelectionMock = jest.mocked(chooseDevice).mockResolvedValue('deviceId')
	const calculateOutputFormatMock = jest.mocked(calculateOutputFormat).mockReturnValue(IOFormat.COMMON)
	const writeDeviceEventsTableMock = jest.mocked(writeDeviceEventsTable)
	const calculateHistoryRequestLimitMock = jest.mocked(calculateRequestLimit)
	const getHistoryMock = jest.mocked(getHistory)

	it('prompts user to select device', async () => {
		getDeviceSpy.mockResolvedValueOnce({ locationId: 'locationId' } as Device)
		historySpy.mockResolvedValueOnce({
			items: [],
			hasNext: (): boolean => false,
		} as unknown as PaginatedList<DeviceActivity>)
		await expect(DeviceHistoryCommand.run(['deviceId'])).resolves.not.toThrow()

		expect(deviceSelectionMock).toHaveBeenCalledWith(
			expect.any(DeviceHistoryCommand),
			'deviceId',
			{ allowIndex: true },
		)
	})

	it('queries history and writes event table interactively', async () => {
		getDeviceSpy.mockResolvedValueOnce({ locationId: 'locationId' } as Device)
		historySpy.mockResolvedValueOnce({
			items: [],
			hasNext: (): boolean => false,
		} as unknown as PaginatedList<DeviceActivity>)

		await expect(DeviceHistoryCommand.run(['deviceId'])).resolves.not.toThrow()

		expect(getDeviceSpy).toHaveBeenCalledTimes(1)
		expect(getDeviceSpy).toHaveBeenCalledWith('deviceId')
		expect(historySpy).toHaveBeenCalledTimes(1)
		expect(historySpy).toHaveBeenCalledWith({
			deviceId: 'deviceId',
			locationId: 'locationId',
		})
		expect(writeDeviceEventsTableMock).toHaveBeenCalledTimes(1)
	})

	it('queries history and write event table directly', async () => {
		const buildOutputFormatterMock = jest.mocked(buildOutputFormatter)
		const writeOutputMock = jest.mocked(writeOutput)

		calculateHistoryRequestLimitMock.mockReturnValueOnce(20)
		getDeviceSpy.mockResolvedValueOnce({ locationId: 'locationId' } as Device)
		historySpy.mockResolvedValueOnce({
			items: [],
			hasNext: (): boolean => false,
		} as unknown as PaginatedList<DeviceActivity>)
		calculateOutputFormatMock.mockReturnValueOnce(IOFormat.JSON)
		buildOutputFormatterMock.mockReturnValueOnce(jsonFormatter(4))

		await expect(DeviceHistoryCommand.run(['deviceId'])).resolves.not.toThrow()

		expect(getDeviceSpy).toHaveBeenCalledTimes(1)
		expect(getDeviceSpy).toHaveBeenCalledWith('deviceId')
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
		expect(writeOutputMock).toHaveBeenCalledTimes(1)

		expect(historySpy).toHaveBeenCalledTimes(0)
		expect(writeDeviceEventsTableMock).toHaveBeenCalledTimes(0)
	})
})
