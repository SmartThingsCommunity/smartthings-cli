import { outputItemOrList } from '@smartthings/cli-lib'
import VirtualDevicesCommand from '../../commands/virtualdevices.js'
import { Device, DeviceIntegrationType, DevicesEndpoint } from '@smartthings/core-sdk'


describe('VirtualDevicesCommand', () => {
	const outputItemOrListMock = jest.mocked(outputItemOrList)
	const devices = [{ deviceId: 'device-id' }] as Device[]
	const listSpy = jest.spyOn(DevicesEndpoint.prototype, 'list').mockResolvedValue(devices)

	test('virtual devices in all locations', async() => {
		await expect(VirtualDevicesCommand.run([])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
	})

	test('use simple fields by default', async() => {
		await expect(VirtualDevicesCommand.run([])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			expect.any(VirtualDevicesCommand),
			expect.objectContaining({
				listTableFieldDefinitions: ['label', 'deviceId'],
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)
	})

	test('include location and room with verbose flag', async() => {
		await expect(VirtualDevicesCommand.run(['--verbose'])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			expect.any(VirtualDevicesCommand),
			expect.objectContaining({
				listTableFieldDefinitions: ['label', 'deviceId', 'location', 'room'],
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)
	})

	test('virtual devices uses location id in list', async() => {
		outputItemOrListMock.mockImplementationOnce(async (_command, _config, _idOrIndex, listFunction) => {
			await listFunction()
		})

		await expect(VirtualDevicesCommand.run(['--location=location-id'])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(listSpy).toHaveBeenCalledTimes(1)
		expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({
			type: DeviceIntegrationType.VIRTUAL,
			locationId: ['location-id'],
		}))
	})

	test('virtual devices uses installed app id in list', async() => {
		outputItemOrListMock.mockImplementationOnce(async (_command, _config, _idOrIndex, listFunction) => {
			await listFunction()
		})

		await expect(VirtualDevicesCommand.run(['--installed-app=installed-app-id'])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(listSpy).toHaveBeenCalledTimes(1)
		expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({
			type: DeviceIntegrationType.VIRTUAL,
			installedAppId: 'installed-app-id',
		}))
	})
})
