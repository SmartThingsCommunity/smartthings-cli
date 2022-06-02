import { ActionFunction, chooseDevice, CustomCommonOutputProducer, DefaultTableGenerator, inputAndOutputItem } from '@smartthings/cli-lib'
import { Device, DevicesEndpoint, DeviceUpdate } from '@smartthings/core-sdk'
import DeviceUpdateCommand from '../../../commands/devices/update'
import { buildTableOutput } from '../../../lib/commands/devices/devices-util'


jest.mock('../../../lib/commands/devices/devices-util')

describe('DeviceUpdateCommand', () => {
	const chooseDeviceMock = jest.mocked(chooseDevice).mockResolvedValue('deviceId')
	const inputAndOutputItemMock = jest.mocked(inputAndOutputItem)

	const updateDeviceSpy = jest.spyOn(DevicesEndpoint.prototype, 'update').mockImplementation()

	it('prompts user to choose device', async () => {
		await expect(DeviceUpdateCommand.run(['deviceId'])).resolves.not.toThrow()

		expect(chooseDeviceMock).toBeCalledWith(expect.any(DeviceUpdateCommand), 'deviceId')
	})

	it('calls inputAndOutputItem with correct config', async () => {
		await expect(DeviceUpdateCommand.run(['deviceId'])).resolves.not.toThrow()

		expect(inputAndOutputItemMock).toBeCalledWith(
			expect.any(DeviceUpdateCommand),
			expect.objectContaining({
				buildTableOutput: expect.any(Function),
			}),
			expect.any(Function),
		)
	})

	it('calls inputAndOutputItem with correct functions', async () => {
		await expect(DeviceUpdateCommand.run(['deviceId'])).resolves.not.toThrow()

		const outputProducerFunction = (inputAndOutputItemMock.mock.calls[0][1] as CustomCommonOutputProducer<Device>).buildTableOutput
		const device = { deviceId: 'deviceId' } as Device
		await outputProducerFunction(device)

		expect(buildTableOutput).toBeCalledWith(expect.any(DefaultTableGenerator), device)

		const actionFunction = inputAndOutputItemMock.mock.calls[0][2] as ActionFunction<void, DeviceUpdate, Device>
		const deviceUpdate = { label: 'device' } as DeviceUpdate
		await actionFunction(undefined, deviceUpdate)

		expect(updateDeviceSpy).toBeCalledWith('deviceId', deviceUpdate)
	})
})
