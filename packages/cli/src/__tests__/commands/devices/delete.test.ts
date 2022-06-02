import { selectFromList } from '@smartthings/cli-lib'
import { DevicesEndpoint } from '@smartthings/core-sdk'
import DeviceDeleteCommand from '../../../commands/devices/delete'


describe('DeviceDeleteCommand', () => {
	const deleteDevicesSpy = jest.spyOn(DevicesEndpoint.prototype, 'delete').mockImplementation()
	const listDevicesSpy = jest.spyOn(DevicesEndpoint.prototype, 'list').mockImplementation()
	const logSpy = jest.spyOn(DeviceDeleteCommand.prototype, 'log').mockImplementation()

	const selectFromListMock = jest.mocked(selectFromList).mockResolvedValue('deviceId')

	it('prompts user to select device', async () => {
		await expect(DeviceDeleteCommand.run(['deviceId'])).resolves.not.toThrow()

		expect(selectFromListMock).toBeCalledWith(
			expect.any(DeviceDeleteCommand),
			expect.objectContaining({
				primaryKeyName: 'deviceId',
				sortKeyName: 'name',
			}),
			expect.objectContaining({
				preselectedId: 'deviceId',
				listItems: expect.any(Function),
				promptMessage: 'Select device to delete.',
			}),
		)
	})

	it('calls correct list endpoint', async () => {
		await expect(DeviceDeleteCommand.run(['deviceId'])).resolves.not.toThrow()

		const listFunction = selectFromListMock.mock.calls[0][2].listItems
		await listFunction()

		expect(listDevicesSpy).toBeCalledTimes(1)
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
