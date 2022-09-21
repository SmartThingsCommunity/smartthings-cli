import { Device, DeviceIntegrationType, HubdevicesEndpoint, SmartThingsClient } from '@smartthings/core-sdk'

import { chooseDevice } from '@smartthings/cli-lib'

import DriversSwitchCommand from '../../../../commands/edge/drivers/switch'
import { chooseDriver, chooseHub, listAllAvailableDrivers, listMatchingDrivers }
	from '../../../../lib/commands/drivers-util'


const edgeDeviceIntegrationTypes = [
	DeviceIntegrationType.LAN,
	DeviceIntegrationType.MATTER,
	DeviceIntegrationType.ZIGBEE,
	DeviceIntegrationType.ZWAVE,
]

jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		chooseDevice: jest.fn(),
	}
})
jest.mock('../../../../../src/lib/commands/drivers-util')

describe('DriversSwitchCommand', () => {
	afterEach(() => {
		jest.clearAllMocks()
	})

	const changeDriverSpy = jest.spyOn(HubdevicesEndpoint.prototype, 'switchDriver').mockImplementation()
	const chooseHubMock = jest.mocked(chooseHub).mockResolvedValue('chosen-hub-id')
	const chooseDeviceMock = jest.mocked(chooseDevice).mockResolvedValue('chosen-device-id')
	const chooseDriverMock = jest.mocked(chooseDriver).mockResolvedValue('chosen-driver-id')

	it('calls changeDriver', async () => {
		await expect(DriversSwitchCommand.run([
			'--hub', 'arg-hub-id',
			'--driver', 'arg-driver-id',
			'arg-device-id',
		])).resolves.not.toThrow()

		expect(chooseHubMock).toHaveBeenCalledTimes(1)
		expect(chooseHubMock).toHaveBeenCalledWith(expect.any(DriversSwitchCommand),
			'Which hub is the device connected to?', 'arg-hub-id',
			{ useConfigDefault: true })

		expect(chooseDeviceMock).toHaveBeenCalledTimes(1)
		expect(chooseDeviceMock).toHaveBeenCalledWith(
			expect.any(DriversSwitchCommand),
			'arg-device-id',
			expect.objectContaining({
				deviceListOptions: expect.objectContaining({
					type: edgeDeviceIntegrationTypes }),
				deviceListFilter: expect.any(Function) },
			),
		)

		expect(chooseDriverMock).toHaveBeenCalledTimes(1)
		expect(chooseDriverMock).toHaveBeenCalledWith(
			expect.any(DriversSwitchCommand),
			'Choose a driver to use.',
			'arg-driver-id',
			expect.objectContaining({ listItems: expect.any(Function) }),
		)

		expect(changeDriverSpy).toHaveBeenCalledTimes(1)
		expect(changeDriverSpy).toHaveBeenCalledWith('chosen-driver-id', 'chosen-hub-id', 'chosen-device-id')
	})

	describe('deviceFilter', () => {
		it.each(edgeDeviceIntegrationTypes)('includes %s devices on specified hub', async (deviceIntegrationType) => {
			await expect(DriversSwitchCommand.run([])).resolves.not.toThrow()

			const deviceListFilter = chooseDeviceMock.mock.calls[0][2]?.deviceListFilter
			expect(deviceListFilter).toBeDefined()

			const device = {
				type: deviceIntegrationType,
				[deviceIntegrationType.toString().toLowerCase()]: { hubId: 'chosen-hub-id' },
			} as unknown as Device
			expect(deviceListFilter?.(device, 0, [])).toBe(true)
		})

		it('rejects non-edge devices', async () => {
			await expect(DriversSwitchCommand.run([])).resolves.not.toThrow()

			const deviceListFilter = chooseDeviceMock.mock.calls[0][2]?.deviceListFilter
			expect(deviceListFilter).toBeDefined()

			const device = {
				type: DeviceIntegrationType.ENDPOINT_APP,
				app: { hubId: 'chosen-hub-id' },
			} as unknown as Device
			expect(deviceListFilter?.(device, 0, [])).toBe(false)
		})

		it('rejects edge devices on different hub', async () => {
			await expect(DriversSwitchCommand.run([])).resolves.not.toThrow()

			const deviceListFilter = chooseDeviceMock.mock.calls[0][2]?.deviceListFilter
			expect(deviceListFilter).toBeDefined()

			const device = {
				type: DeviceIntegrationType.ZIGBEE,
				zigbee: { hubId: 'other-hub-id' },
			} as unknown as Device
			expect(deviceListFilter?.(device, 0, [])).toBe(false)
		})
	})

	describe('listItems', () => {
		const matchingDriver = { driverId: 'matching-driver-id', name: 'Matching Driver' }
		const matchingDrivers = [matchingDriver]
		const listMatchingDriversMock = jest.mocked(listMatchingDrivers)
			.mockResolvedValue(matchingDrivers)
		const otherDriver = { driverId: 'other-driver-id', name: 'Other Driver' }
		const allDrivers = [matchingDriver, otherDriver]
		const listAllAvailableDriversMock = jest.mocked(listAllAvailableDrivers)
			.mockResolvedValue(allDrivers)
		it('uses listMatchingDrivers normally', async () => {
			await expect(DriversSwitchCommand.run([])).resolves.not.toThrow()

			const listItems = chooseDriverMock.mock.calls[0][3]?.listItems
			expect(listItems).toBeDefined()
			expect(await listItems?.()).toStrictEqual(matchingDrivers)

			expect(listMatchingDriversMock).toHaveBeenCalledTimes(1)
			expect(listMatchingDriversMock).toHaveBeenCalledWith(
				expect.any(SmartThingsClient),
				'chosen-device-id', 'chosen-hub-id')
			expect(listAllAvailableDriversMock).toHaveBeenCalledTimes(0)
		})

		it('lists all drivers when requested', async () => {
			await expect(DriversSwitchCommand.run(['--include-non-matching'])).resolves.not.toThrow()

			const listItems = chooseDriverMock.mock.calls[0][3]?.listItems
			expect(listItems).toBeDefined()
			expect(await listItems?.()).toStrictEqual(allDrivers)

			expect(listMatchingDriversMock).toHaveBeenCalledTimes(0)
			expect(listAllAvailableDriversMock).toHaveBeenCalledTimes(1)
			expect(listAllAvailableDriversMock).toHaveBeenCalledWith(
				expect.any(SmartThingsClient),
				'chosen-device-id', 'chosen-hub-id')
		})
	})
})
