import {
	Device,
	DeviceIntegrationType,
	DriverChannelDetails,
	EdgeDriverSummary,
	InstalledDriver,
	Location,
	OrganizationResponse,
	SmartThingsClient,
} from '@smartthings/core-sdk'

import {
	APICommand,
	ChooseOptions,
	chooseOptionsWithDefaults,
	forAllOrganizations,
	selectFromList,
	stringTranslateToId,
	TableGenerator,
	WithOrganization,
} from '@smartthings/cli-lib'

import {
	chooseDriver,
	chooseDriverFromChannel,
	DriverChannelDetailsWithName,
	getDriverDevices,
	listAllAvailableDrivers,
	listMatchingDrivers,
	withoutCurrentDriver,
} from '../../../lib/commands/drivers-util.js'
import * as driversUtil from '../../../lib/commands/drivers-util.js'


jest.mock('@smartthings/cli-lib', () => ({
	chooseOptionsDefaults: jest.fn(),
	chooseOptionsWithDefaults: jest.fn(),
	stringTranslateToId: jest.fn(),
	selectFromList: jest.fn(),
	forAllOrganizations: jest.fn(),
}))

const selectFromListMock = jest.mocked(selectFromList)
const stringTranslateToIdMock = jest.mocked(stringTranslateToId)

const client = {
	drivers: { listDefault: jest.fn() },
	devices: { get: jest.fn(), list: jest.fn() },
	hubdevices: { listInstalled: jest.fn() },
} as unknown as SmartThingsClient
const apiDriversListMock = jest.mocked(client.drivers.list)
const apiDriversListDefaultMock = jest.mocked(client.drivers.listDefault)
const apiDevicesGetMock = jest.mocked(client.devices.get)
const apiDevicesListMock = jest.mocked(client.devices.list)
const apiHubdevicesListInstalledMock = jest.mocked(client.hubdevices.listInstalled)

test.each`
	deviceType  | expectedCount
	${'lan'}    | ${3}
	${'matter'} | ${3}
	${'zigbee'} | ${3}
	${'zwave'}  | ${3}
	${'other'}  | ${4}
`('withoutCurrentDriver filters ', async ({ deviceType, expectedCount }) => {
	const drivers = [
		{ name: 'lan', driverId: 'lan-driver-id' },
		{ name: 'matter', driverId: 'matter-driver-id' },
		{ name: 'zigbee', driverId: 'zigbee-driver-id' },
		{ name: 'zwave', driverId: 'zwave-driver-id' },
	]

	const driverId = `${deviceType}-driver-id`
	const device = { [deviceType]: { driverId } } as unknown as Device
	apiDevicesGetMock.mockResolvedValueOnce(device)

	const result = await withoutCurrentDriver(client, 'device-id', drivers)
	expect(result.length).toBe(expectedCount)
	expect(result.find(driver => driver.driverId === driverId)).toBeUndefined()

	expect(apiDevicesGetMock).toHaveBeenCalledTimes(1)
	expect(apiDevicesGetMock).toHaveBeenCalledWith('device-id')
})

const installedDriver = { driverId: 'installed-driver-id', name: 'Installed Driver' } as InstalledDriver
const defaultDriver = { driverId: 'default-driver-id', name: 'Default Driver' } as EdgeDriverSummary
const currentDriver = { driverId: 'current-driver-id', name: 'Current Driver' } as InstalledDriver
const device = { zigbee: { driverId: 'current-driver-id' } } as Device

describe('listAllAvailableDrivers', () => {
	it('combines default and installed drivers lists', async () => {
		apiDevicesGetMock.mockResolvedValueOnce(device)

		apiHubdevicesListInstalledMock.mockResolvedValueOnce([installedDriver])
		apiDriversListDefaultMock.mockResolvedValueOnce([defaultDriver])

		const result = await listAllAvailableDrivers(client, 'device-id', 'hub-id')
		expect(result.length).toBe(2)
		expect(result).toEqual(expect.arrayContaining([defaultDriver, installedDriver]))

		expect(apiHubdevicesListInstalledMock).toHaveBeenCalledTimes(1)
		expect(apiHubdevicesListInstalledMock).toHaveBeenCalledWith('hub-id')
		expect(apiDriversListDefaultMock).toHaveBeenCalledTimes(1)
		expect(apiDriversListDefaultMock).toHaveBeenCalledWith()
		expect(apiDevicesGetMock).toHaveBeenCalledTimes(1)
		expect(apiDevicesGetMock).toHaveBeenCalledWith('device-id')
	})

	it('filters out current driver', async () => {
		apiDevicesGetMock.mockResolvedValueOnce(device)

		apiHubdevicesListInstalledMock.mockResolvedValueOnce([installedDriver, currentDriver])
		apiDriversListDefaultMock.mockResolvedValueOnce([defaultDriver])

		const result = await listAllAvailableDrivers(client, 'device-id', 'hub-id')
		expect(result.length).toBe(2)
		expect(result).toEqual(expect.arrayContaining([defaultDriver, installedDriver]))

		expect(apiHubdevicesListInstalledMock).toHaveBeenCalledTimes(1)
		expect(apiHubdevicesListInstalledMock).toHaveBeenCalledWith('hub-id')
		expect(apiDriversListDefaultMock).toHaveBeenCalledTimes(1)
		expect(apiDriversListDefaultMock).toHaveBeenCalledWith()
		expect(apiDevicesGetMock).toHaveBeenCalledTimes(1)
		expect(apiDevicesGetMock).toHaveBeenCalledWith('device-id')
	})

	it('filters out duplicates', async () => {
		apiDevicesGetMock.mockResolvedValueOnce(device)

		apiHubdevicesListInstalledMock.mockResolvedValueOnce([installedDriver, defaultDriver as unknown as InstalledDriver])
		apiDriversListDefaultMock.mockResolvedValueOnce([defaultDriver])

		const result = await listAllAvailableDrivers(client, 'device-id', 'hub-id')
		expect(result.length).toBe(2)
		expect(result).toEqual(expect.arrayContaining([defaultDriver, installedDriver]))

		expect(apiHubdevicesListInstalledMock).toHaveBeenCalledTimes(1)
		expect(apiHubdevicesListInstalledMock).toHaveBeenCalledWith('hub-id')
		expect(apiDriversListDefaultMock).toHaveBeenCalledTimes(1)
		expect(apiDriversListDefaultMock).toHaveBeenCalledWith()
		expect(apiDevicesGetMock).toHaveBeenCalledTimes(1)
		expect(apiDevicesGetMock).toHaveBeenCalledWith('device-id')
	})
})

describe('listMatchingDrivers', () => {
	it('lists matching drivers', async () => {
		apiHubdevicesListInstalledMock.mockResolvedValueOnce([installedDriver])
		apiDevicesGetMock.mockResolvedValueOnce(device)

		expect(await listMatchingDrivers(client, 'device-id', 'hub-id'))
			.toStrictEqual([installedDriver])

		expect(apiHubdevicesListInstalledMock).toHaveBeenCalledTimes(1)
		expect(apiHubdevicesListInstalledMock).toHaveBeenCalledWith('hub-id', 'device-id')
		expect(apiDevicesGetMock).toHaveBeenCalledTimes(1)
		expect(apiDevicesGetMock).toHaveBeenCalledWith('device-id')
	})

	it('filters out current driver', async () => {
		apiHubdevicesListInstalledMock.mockResolvedValueOnce([installedDriver, currentDriver])
		apiDevicesGetMock.mockResolvedValueOnce(device)

		expect(await listMatchingDrivers(client, 'device-id', 'hub-id'))
			.toStrictEqual([installedDriver])

		expect(apiHubdevicesListInstalledMock).toHaveBeenCalledTimes(1)
		expect(apiHubdevicesListInstalledMock).toHaveBeenCalledWith('hub-id', 'device-id')
		expect(apiDevicesGetMock).toHaveBeenCalledTimes(1)
		expect(apiDevicesGetMock).toHaveBeenCalledWith('device-id')
	})
})

test('chooseDriverFromChannel presents user with list of drivers with names', async () => {
	const command = { client } as APICommand<typeof APICommand.flags>
	selectFromListMock.mockResolvedValueOnce('chosen-driver-id')

	expect(await chooseDriverFromChannel(command, 'channel-id', 'preselected-driver-id')).toBe('chosen-driver-id')

	expect(selectFromListMock).toHaveBeenCalledTimes(1)
	expect(selectFromListMock).toHaveBeenCalledWith(command,
		expect.objectContaining({ primaryKeyName: 'driverId', sortKeyName: 'name' }),
		expect.objectContaining({
			preselectedId: 'preselected-driver-id',
			promptMessage: 'Select a driver to install.',
		}))

	const drivers = [{ name: 'driver' }] as DriverChannelDetailsWithName[]
	const listAssignedDriversWithNamesSpy = jest.spyOn(driversUtil, 'listAssignedDriversWithNames')
		.mockResolvedValueOnce(drivers)

	const listItems = selectFromListMock.mock.calls[0][2].listItems

	expect(await listItems()).toBe(drivers)

	expect(listAssignedDriversWithNamesSpy).toHaveBeenCalledTimes(1)
	expect(listAssignedDriversWithNamesSpy).toHaveBeenCalledWith(client, 'channel-id')
})

test('chooseInstalledDriver presents user with list of drivers with names', async () => {
	const command = { client } as APICommand<typeof APICommand.flags>
	selectFromListMock.mockResolvedValueOnce('chosen-driver-id')
	stringTranslateToIdMock.mockResolvedValueOnce('preselected-driver-id')

	expect(await driversUtil.chooseInstalledDriver(command, 'hub-id', 'prompt message', 'command-line-driver-id'))
		.toBe('chosen-driver-id')

	expect(stringTranslateToIdMock).toHaveBeenCalledTimes(1)
	expect(stringTranslateToIdMock).toHaveBeenCalledWith(
		expect.objectContaining({ primaryKeyName: 'driverId', sortKeyName: 'name' }),
		'command-line-driver-id', expect.any(Function))
	expect(selectFromListMock).toHaveBeenCalledTimes(1)
	expect(selectFromListMock).toHaveBeenCalledWith(command,
		expect.objectContaining({ primaryKeyName: 'driverId', sortKeyName: 'name' }),
		expect.objectContaining({
			preselectedId: 'preselected-driver-id',
			promptMessage: 'prompt message',
		}))
	expect(apiHubdevicesListInstalledMock).toHaveBeenCalledTimes(0)

	const listItems = stringTranslateToIdMock.mock.calls[0][2]
	apiHubdevicesListInstalledMock.mockResolvedValueOnce([installedDriver])

	expect(await listItems()).toStrictEqual([installedDriver])

	expect(apiHubdevicesListInstalledMock).toHaveBeenCalledTimes(1)
	expect(apiHubdevicesListInstalledMock).toHaveBeenCalledWith('hub-id')
})

describe('getDriverDevices', () => {
	it('includes only edge device types', async () => {
		const hubDevices = [
			{ deviceId: 'hub-device-id', label: 'Hub Label' },
		] as Device[]
		const edgeDevices = [
			{
				type: DeviceIntegrationType.LAN,
				deviceId: 'lan-device-id',
				label: 'LAN Device',
				lan: {
					driverId: 'lan-driver-id',
					hubId: 'hub-device-id',
				},
			},
			{
				type: DeviceIntegrationType.MATTER,
				deviceId: 'matter-device-id',
				label: 'Matter Device',
				matter: {
					driverId: 'matter-driver-id',
					hubId: 'hub-device-id',
				},
			},
			{
				type: DeviceIntegrationType.ZIGBEE,
				deviceId: 'zigbee-device-id',
				label: 'Zigbee Device',
				zigbee: {
					driverId: 'zigbee-driver-id',
					hubId: 'hub-device-id',
				},
			},
			{
				type: DeviceIntegrationType.ZWAVE,
				deviceId: 'zwave-device-id',
				label: 'Z-Wave Device',
				zwave: {
					driverId: 'zwave-driver-id',
					hubId: 'bad-hub-device-id',
				},
			},
		] as Device[]
		const driverDevices: driversUtil.DeviceDriverInfo[] = [
			{
				type: DeviceIntegrationType.LAN,
				label: 'LAN Device',
				deviceId: 'lan-device-id',
				driverId: 'lan-driver-id',
				hubId: 'hub-device-id',
				hubLabel: 'Hub Label',
			},
			{
				type: DeviceIntegrationType.MATTER,
				label: 'Matter Device',
				deviceId: 'matter-device-id',
				driverId: 'matter-driver-id',
				hubId: 'hub-device-id',
				hubLabel: 'Hub Label',
			},
			{
				type: DeviceIntegrationType.ZIGBEE,
				label: 'Zigbee Device',
				deviceId: 'zigbee-device-id',
				driverId: 'zigbee-driver-id',
				hubId: 'hub-device-id',
				hubLabel: 'Hub Label',
			},
			{
				type: DeviceIntegrationType.ZWAVE,
				label: 'Z-Wave Device',
				deviceId: 'zwave-device-id',
				driverId: 'zwave-driver-id',
				hubId: 'bad-hub-device-id',
				hubLabel: undefined,
			},
		]

		apiDevicesListMock.mockResolvedValueOnce(hubDevices)
		apiDevicesListMock.mockResolvedValueOnce(edgeDevices)

		expect(await getDriverDevices(client)).toStrictEqual(driverDevices)

		expect(apiDevicesListMock).toHaveBeenCalledTimes(2)
		expect(apiDevicesListMock).toHaveBeenCalledWith({ type: DeviceIntegrationType.HUB })
		expect(apiDevicesListMock).toHaveBeenCalledWith({ type: driversUtil.edgeDeviceTypes })
	})

	it('throws exception for invalid device input', async () => {
		const hubDevices = [{ deviceId: 'hub-device-id', label: 'Hub Label' }] as Device[]
		const edgeDevices = [
			{
				type: DeviceIntegrationType.LAN,
				deviceId: 'lan-device-id',
				label: 'LAN Device',
			},
		] as Device[]

		apiDevicesListMock.mockResolvedValueOnce(hubDevices)
		apiDevicesListMock.mockResolvedValueOnce(edgeDevices)

		await expect(getDriverDevices(client)).rejects.toThrow('unexpected device type LAN or missing type info')

		expect(apiDevicesListMock).toHaveBeenCalledTimes(2)
		expect(apiDevicesListMock).toHaveBeenCalledWith({ type: DeviceIntegrationType.HUB })
		expect(apiDevicesListMock).toHaveBeenCalledWith({ type: driversUtil.edgeDeviceTypes })
	})
})
