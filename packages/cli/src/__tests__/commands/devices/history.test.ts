import {
	buildOutputFormatter,
	calculateOutputFormat,
	chooseDevice,
	IOFormat,
	jsonFormatter,
	writeOutput,
} from '@smartthings/cli-lib'
import { Device, DeviceActivity, DevicesEndpoint, HistoryEndpoint, PaginatedList } from '@smartthings/core-sdk'
import DeviceHistoryCommand from '../../../commands/devices/history'
import { writeDeviceEventsTable } from '../../../lib/commands/history-util'


jest.mock('../../../lib/commands/history-util')

describe('DeviceHistoryCommand', () => {
	const getDeviceSpy = jest.spyOn(DevicesEndpoint.prototype, 'get').mockImplementation()
	const historySpy = jest.spyOn(HistoryEndpoint.prototype, 'devices').mockImplementation()
	const deviceSelectionMock = jest.mocked(chooseDevice).mockResolvedValue('deviceId')
	const calculateOutputFormatMock = jest.mocked(calculateOutputFormat).mockReturnValue(IOFormat.COMMON)
	const writeDeviceEventsTableMock = jest.mocked(writeDeviceEventsTable)

	it('prompts user to select device', async () => {
		getDeviceSpy.mockResolvedValue({ locationId: 'locationId' } as Device)
		historySpy.mockResolvedValueOnce({
			items: [],
			hasNext: (): boolean => false,
		} as unknown as PaginatedList<DeviceActivity>)
		await expect(DeviceHistoryCommand.run(['deviceId'])).resolves.not.toThrow()

		expect(deviceSelectionMock).toBeCalledWith(
			expect.any(DeviceHistoryCommand),
			'deviceId',
			{ allowIndex: true },
		)
	})

	it('queries history and writes event table interactively', async () => {
		getDeviceSpy.mockResolvedValue({ locationId: 'locationId' } as Device)
		historySpy.mockResolvedValueOnce({
			items: [],
			hasNext: (): boolean => false,
		} as unknown as PaginatedList<DeviceActivity>)

		await expect(DeviceHistoryCommand.run(['deviceId'])).resolves.not.toThrow()

		expect(getDeviceSpy).toBeCalledTimes(1)
		expect(getDeviceSpy).toBeCalledWith('deviceId')
		expect(historySpy).toBeCalledTimes(1)
		expect(historySpy).toBeCalledWith({
			deviceId: 'deviceId',
			locationId: 'locationId',
		})
		expect(writeDeviceEventsTableMock).toBeCalledTimes(1)
	})

	it('queries history and write event table directly', async () => {
		const buildOutputFormatterMock = jest.mocked(buildOutputFormatter)
		const writeOutputMock = jest.mocked(writeOutput)

		getDeviceSpy.mockResolvedValue({ locationId: 'locationId' } as Device)
		historySpy.mockResolvedValueOnce({
			items: [],
			hasNext: (): boolean => false,
		} as unknown as PaginatedList<DeviceActivity>)
		calculateOutputFormatMock.mockReturnValue(IOFormat.JSON)
		buildOutputFormatterMock.mockReturnValue(jsonFormatter(4))

		await expect(DeviceHistoryCommand.run(['deviceId'])).resolves.not.toThrow()

		expect(getDeviceSpy).toBeCalledTimes(1)
		expect(getDeviceSpy).toBeCalledWith('deviceId')
		expect(historySpy).toBeCalledTimes(1)
		expect(historySpy).toBeCalledWith({
			deviceId: 'deviceId',
			locationId: 'locationId',
		})
		expect(writeDeviceEventsTableMock).toBeCalledTimes(0)
		expect(buildOutputFormatterMock).toBeCalledTimes(1)
		expect(writeOutputMock).toBeCalledTimes(1)
	})
})
