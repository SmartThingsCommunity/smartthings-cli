import { Device, DevicesEndpoint, SmartThingsClient } from '@smartthings/core-sdk'

import {
	CustomCommonOutputProducer, DefaultTableGenerator, outputListing,
	withLocationsAndRooms, WithNamedRoom,
} from '@smartthings/cli-lib'

import DevicesCommand from '../../commands/devices'

import { buildTableOutput } from '../../lib/commands/devices/devices-util'


jest.mock('../../lib/commands/devices/devices-util')

describe('DevicesCommand', () => {
	const outputListingMock = jest.mocked(outputListing)

	it('passes undefined for location id when not specified', async () => {
		await expect(DevicesCommand.run([])).resolves.not.toThrow()

		expect(outputListingMock).toHaveBeenCalledTimes(1)
		expect(outputListingMock.mock.calls[0][2]).toBeUndefined()
	})

	it('passes argument as location id', async () => {
		await expect(DevicesCommand.run(['location-id'])).resolves.not.toThrow()

		expect(outputListingMock).toHaveBeenCalledTimes(1)
		expect(outputListingMock.mock.calls[0][2]).toBe('location-id')
	})

	it('uses simple fields by default', async () => {
		await expect(DevicesCommand.run([])).resolves.not.toThrow()

		expect(outputListingMock).toHaveBeenCalledTimes(1)
		expect(outputListingMock.mock.calls[0][1].listTableFieldDefinitions)
			.toEqual(['label', 'name', 'type', 'deviceId'])
	})

	it('includes location and room with verbose flag', async () => {
		await expect(DevicesCommand.run(['--verbose'])).resolves.not.toThrow()

		expect(outputListingMock).toHaveBeenCalledTimes(1)
		expect(outputListingMock.mock.calls[0][1].listTableFieldDefinitions)
			.toEqual(['label', 'name', 'type', 'location', 'room', 'deviceId'])
	})

	it('uses buildTableOutput from devices-util', async () => {
		await expect(DevicesCommand.run([])).resolves.not.toThrow()

		expect(outputListingMock).toHaveBeenCalledTimes(1)
		expect(outputListingMock.mock.calls[0][1].listTableFieldDefinitions)
			.toEqual(['label', 'name', 'type', 'deviceId'])

		const device = { deviceId: 'device-id' } as Device
		const buildTableOutputMock = jest.mocked(buildTableOutput)
		const config = outputListingMock.mock.calls[0][1] as CustomCommonOutputProducer<Device>
		buildTableOutputMock.mockReturnValueOnce('table output')

		expect(config.buildTableOutput(device)).toBe('table output')

		expect(buildTableOutputMock).toHaveBeenCalledTimes(1)
		expect(buildTableOutputMock).toHaveBeenCalledWith(expect.any(DefaultTableGenerator), device)
	})

	describe('list function', () => {
		const devices = [{ deviceId: 'device-id' }] as Device[]
		const listSpy = jest.spyOn(DevicesEndpoint.prototype, 'list').mockResolvedValue(devices)
		const withLocationsAndRoomsMock = jest.mocked(withLocationsAndRooms)

		it('uses devices.list without verbose flag', async () => {
			await expect(DevicesCommand.run([])).resolves.not.toThrow()

			expect(outputListingMock).toHaveBeenCalledTimes(1)
			expect(outputListingMock.mock.calls[0][1].listTableFieldDefinitions)
				.toEqual(['label', 'name', 'type', 'deviceId'])

			const listDevices = outputListingMock.mock.calls[0][3]

			expect(await listDevices()).toBe(devices)

			expect(listSpy).toHaveBeenCalledTimes(1)
			expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ capability: undefined }))
			expect(withLocationsAndRoomsMock).toHaveBeenCalledTimes(0)
		})

		it('adds locations with verbose flag', async () => {
			await expect(DevicesCommand.run(['--verbose'])).resolves.not.toThrow()

			expect(outputListingMock).toHaveBeenCalledTimes(1)
			expect(outputListingMock.mock.calls[0][1].listTableFieldDefinitions)
				.toEqual(['label', 'name', 'type', 'location', 'room', 'deviceId'])

			const listDevices = outputListingMock.mock.calls[0][3]

			const verboseDevices = [
				{ deviceId: 'device-id', location: 'location name', room: 'room name' },
			] as (Device & WithNamedRoom)[]
			withLocationsAndRoomsMock.mockResolvedValue(verboseDevices)

			expect(await listDevices()).toBe(verboseDevices)

			expect(listSpy).toHaveBeenCalledTimes(1)
			expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ capability: undefined }))
			expect(withLocationsAndRoomsMock).toHaveBeenCalledTimes(1)
			expect(withLocationsAndRoomsMock).toHaveBeenCalledWith(expect.any(SmartThingsClient), devices)
		})

		it('uses capability flag in devices.list', async () => {
			await expect(DevicesCommand.run(['--capability', 'cmd-line-capability'])).resolves.not.toThrow()

			expect(outputListingMock).toHaveBeenCalledTimes(1)
			expect(outputListingMock.mock.calls[0][1].listTableFieldDefinitions)
				.toEqual(['label', 'name', 'type', 'deviceId'])

			const listDevices = outputListingMock.mock.calls[0][3]

			expect(await listDevices()).toBe(devices)

			expect(listSpy).toHaveBeenCalledTimes(1)
			expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ capability: ['cmd-line-capability'] }))
			expect(withLocationsAndRoomsMock).toHaveBeenCalledTimes(0)
		})

		it('uses capabilities-mode in devices.list', async () => {
			await expect(DevicesCommand.run([
				'--capability', 'cmd-line-capability',
				'--capability', 'other-capability',
				'--capabilities-mode', 'or',
			])).resolves.not.toThrow()

			expect(outputListingMock).toHaveBeenCalledTimes(1)
			expect(outputListingMock.mock.calls[0][1].listTableFieldDefinitions)
				.toEqual(['label', 'name', 'type', 'deviceId'])

			const listDevices = outputListingMock.mock.calls[0][3]

			expect(await listDevices()).toBe(devices)

			expect(listSpy).toHaveBeenCalledTimes(1)
			expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({
				capabilitiesMode: 'or',
				capability: ['cmd-line-capability', 'other-capability'],
			}))
			expect(withLocationsAndRoomsMock).toHaveBeenCalledTimes(0)
		})
	})

	it('uses devices.get to get device', async () => {
		await expect(DevicesCommand.run(['--capability', 'cmd-line-capability'])).resolves.not.toThrow()

		expect(outputListingMock).toHaveBeenCalledTimes(1)
		expect(outputListingMock.mock.calls[0][1].listTableFieldDefinitions)
			.toEqual(['label', 'name', 'type', 'deviceId'])

		const device = { deviceId: 'device-id' } as Device
		const getSpy = jest.spyOn(DevicesEndpoint.prototype, 'get').mockResolvedValue(device)
		const getDevice = outputListingMock.mock.calls[0][4]

		expect(await getDevice('chosen-device-id')).toBe(device)

		expect(getSpy).toHaveBeenCalledTimes(1)
		expect(getSpy).toHaveBeenCalledWith('chosen-device-id')
	})
})
