import { DeviceIntegrationType, DevicesEndpoint } from '@smartthings/core-sdk'

import { chooseDevice } from '@smartthings/cli-lib'

import VirtualDeviceDeleteCommand from '../../../commands/virtualdevices/delete.js'


describe('VirtualDeviceDeleteCommand', () => {
	const deleteDevicesSpy = jest.spyOn(DevicesEndpoint.prototype, 'delete').mockImplementation()
	const logSpy = jest.spyOn(VirtualDeviceDeleteCommand.prototype, 'log').mockImplementation()

	const chooseDeviceMock = jest.mocked(chooseDevice).mockResolvedValue('deviceId')

	it('prompts user to select device', async () => {
		await expect(VirtualDeviceDeleteCommand.run(['deviceId'])).resolves.not.toThrow()

		expect(chooseDeviceMock).toBeCalledWith(
			expect.any(VirtualDeviceDeleteCommand),
			'deviceId',
			expect.objectContaining({ deviceListOptions: { type: DeviceIntegrationType.VIRTUAL } }),
		)
	})

	it('deletes the device and logs success', async () => {
		await expect(VirtualDeviceDeleteCommand.run(['deviceId'])).resolves.not.toThrow()

		expect(deleteDevicesSpy).toBeCalledTimes(1)
		expect(deleteDevicesSpy).toBeCalledWith('deviceId')
		expect(logSpy).toBeCalledWith('Device deviceId deleted.')
	})

	it('throws errors from client unmodified', async () => {
		const error = new Error('failure')
		deleteDevicesSpy.mockRejectedValueOnce(error)

		await expect(VirtualDeviceDeleteCommand.run(['deviceId'])).rejects.toThrow(error)
	})
})
