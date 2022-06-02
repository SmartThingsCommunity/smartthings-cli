import { outputListing } from '@smartthings/cli-lib'
import VirtualDevicesCommand from '../../commands/virtualdevices'
import { Device, DeviceIntegrationType, DevicesEndpoint } from '@smartthings/core-sdk'


describe('VirtualDevicesCommand', () => {
	const outputListingMock = jest.mocked(outputListing)
	const devices = [{ deviceId: 'device-id' }] as Device[]
	const listSpy = jest.spyOn(DevicesEndpoint.prototype, 'list').mockResolvedValue(devices)

	test('virtual devices in all locations', async() => {
		await expect(VirtualDevicesCommand.run([])).resolves.not.toThrow()

		expect(outputListingMock).toHaveBeenCalledTimes(1)
	})

	test('use simple fields by default', async() => {
		await expect(VirtualDevicesCommand.run([])).resolves.not.toThrow()

		expect(outputListingMock).toHaveBeenCalledTimes(1)
		expect(outputListingMock.mock.calls[0][1].listTableFieldDefinitions)
			.toEqual(['label', 'deviceId'])
	})

	test('include location and room with verbose flag', async() => {
		await expect(VirtualDevicesCommand.run(['--verbose'])).resolves.not.toThrow()

		expect(outputListingMock).toHaveBeenCalledTimes(1)
		expect(outputListingMock.mock.calls[0][1].listTableFieldDefinitions)
			.toEqual(['label', 'deviceId', 'location', 'room'])
	})

	test('virtual devices uses location id in list', async() => {
		outputListingMock.mockImplementationOnce(async (_command, _config, _idOrIndex, listFunction) => {
			await listFunction()
		})

		await expect(VirtualDevicesCommand.run(['--location-id=location-id'])).resolves.not.toThrow()

		expect(outputListingMock).toHaveBeenCalledTimes(1)
		expect(listSpy).toHaveBeenCalledTimes(1)
		expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({
			type: DeviceIntegrationType.VIRTUAL,
			locationId: ['location-id'],
		}))
	})

	test('virtual devices uses installed app id in list', async() => {
		outputListingMock.mockImplementationOnce(async (_command, _config, _idOrIndex, listFunction) => {
			await listFunction()
		})

		await expect(VirtualDevicesCommand.run(['--installed-app-id=installed-app-id'])).resolves.not.toThrow()

		expect(outputListingMock).toHaveBeenCalledTimes(1)
		expect(listSpy).toHaveBeenCalledTimes(1)
		expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({
			type: DeviceIntegrationType.VIRTUAL,
			installedAppId: 'installed-app-id',
		}))
	})
})
