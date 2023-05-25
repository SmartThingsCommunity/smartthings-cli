import { chooseDevice } from '@smartthings/cli-lib'
import { DevicesEndpoint } from '@smartthings/core-sdk'
import DeviceDeleteCommand from '../../../commands/devices/delete.js'


describe('DeviceDeleteCommand', () => {
	const deleteDevicesSpy = jest.spyOn(DevicesEndpoint.prototype, 'delete').mockImplementation()
	const logSpy = jest.spyOn(DeviceDeleteCommand.prototype, 'log').mockImplementation()

	const deviceSelectionMock = jest.mocked(chooseDevice).mockResolvedValue('deviceId')

	it('prompts user to select device', async () => {
		await expect(DeviceDeleteCommand.run(['deviceId'])).resolves.not.toThrow()

		expect(deviceSelectionMock).toBeCalledWith(
			expect.any(DeviceDeleteCommand),
			'deviceId',
		)
	})

	it('deletes the device and logs success', async () => {
		await expect(DeviceDeleteCommand.run(['deviceId'])).resolves.not.toThrow()

		expect(deleteDevicesSpy).toBeCalledTimes(1)
		expect(deleteDevicesSpy).toBeCalledWith('deviceId')
		expect(logSpy).toBeCalledWith('Device deviceId deleted.')
	})

	it('throws errors from client unmodified', async () => {
		const error = new Error('failure')
		deleteDevicesSpy.mockRejectedValueOnce(error)

		await expect(DeviceDeleteCommand.run(['deviceId'])).rejects.toThrow(error)
	})
})
