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
	chooseHub,
	DriverChannelDetailsWithName,
	getDriverDevices,
	listAllAvailableDrivers,
	listAssignedDriversWithNames,
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

describe('chooseDriver', () => {
	const command = { client } as APICommand<typeof APICommand.flags>

	it('presents user with list of drivers', async () => {
		selectFromListMock.mockImplementation(async () => 'chosen-driver-id')

		expect(await chooseDriver(command, 'prompt message', 'command-line-driver-id')).toBe('chosen-driver-id')

		expect(stringTranslateToIdMock).toHaveBeenCalledTimes(0)
		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(command,
			expect.objectContaining({ primaryKeyName: 'driverId', sortKeyName: 'name' }),
			expect.objectContaining({ preselectedId: 'command-line-driver-id', promptMessage: 'prompt message' }))
	})

	it('translates id from index if allowed', async () => {
		stringTranslateToIdMock.mockResolvedValueOnce('translated-id')
		selectFromListMock.mockImplementation(async () => 'chosen-driver-id')

		expect(await chooseDriver(command, 'prompt message', 'command-line-driver-id',
			{ allowIndex: true })).toBe('chosen-driver-id')

		expect(stringTranslateToIdMock).toHaveBeenCalledTimes(1)
		expect(stringTranslateToIdMock).toHaveBeenCalledWith(
			expect.objectContaining({ primaryKeyName: 'driverId', sortKeyName: 'name' }),
			'command-line-driver-id', expect.any(Function))
		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(command,
			expect.objectContaining({ primaryKeyName: 'driverId', sortKeyName: 'name' }),
			expect.objectContaining({ preselectedId: 'translated-id', promptMessage: 'prompt message' }))
	})

	it('uses list function that lists drivers', async () => {
		selectFromListMock.mockImplementation(async () => 'chosen-driver-id')

		expect(await chooseDriver(command, 'prompt message', 'command-line-driver-id'))
			.toBe('chosen-driver-id')

		expect(stringTranslateToIdMock).toHaveBeenCalledTimes(0)
		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(command,
			expect.objectContaining({ primaryKeyName: 'driverId', sortKeyName: 'name' }),
			expect.objectContaining({ preselectedId: 'command-line-driver-id', promptMessage: 'prompt message' }))

		const listItems = selectFromListMock.mock.calls[0][2].listItems

		apiDriversListMock.mockResolvedValueOnce(driverList)

		expect(await listItems()).toBe(driverList)

		expect(apiDriversListMock).toHaveBeenCalledTimes(1)
		expect(apiDriversListMock).toHaveBeenCalledWith()
	})

	it('uses supplied list function', async () => {
		selectFromListMock.mockImplementation(async () => 'chosen-driver-id')

		const listItemsMock = jest.fn()
		expect(await chooseDriver(command, 'prompt message', 'command-line-driver-id', { listItems: listItemsMock }))
			.toBe('chosen-driver-id')

		expect(stringTranslateToIdMock).toHaveBeenCalledTimes(0)
		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(command,
			expect.objectContaining({ primaryKeyName: 'driverId', sortKeyName: 'name' }),
			expect.objectContaining({ preselectedId: 'command-line-driver-id', promptMessage: 'prompt message' }))

		const listItems = selectFromListMock.mock.calls[0][2].listItems

		listItemsMock.mockResolvedValueOnce(driverList)

		expect(await listItems()).toBe(driverList)

		expect(apiDriversListMock).toHaveBeenCalledTimes(0)
		expect(listItemsMock).toHaveBeenCalledTimes(1)
		expect(listItemsMock).toHaveBeenCalledWith()
	})
})

describe('chooseHub', () => {
	const hub = { deviceId: 'hub-device-id', label: 'hub label' } as Device

	const listDevicesMock = jest.fn()
	const getDevicesMock = jest.fn()
	const getLocationsMock = jest.fn()
	const client = { devices: { list: listDevicesMock, get: getDevicesMock }, locations: { get: getLocationsMock } }
	const logToStderrMock = jest.fn()
	const command = {
		client,
		logToStderr: logToStderrMock,
		logger: { warn: jest.fn() },
	} as unknown as APICommand<typeof APICommand.flags>

	const chooseOptionsWithDefaultsMock = jest.mocked(chooseOptionsWithDefaults)
	const stringTranslateToIdMock = jest.mocked(stringTranslateToId)

	it('uses default hub if specified', async () => {
		chooseOptionsWithDefaultsMock.mockReturnValueOnce({ allowIndex: false, useConfigDefault: true } as ChooseOptions<Device>)
		selectFromListMock.mockImplementation(async () => 'chosen-hub-id')

		expect(await chooseHub(command, 'prompt message', undefined,
			{ useConfigDefault: true })).toBe('chosen-hub-id')

		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledTimes(1)
		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledWith({ useConfigDefault: true })
		expect(stringTranslateToIdMock).toHaveBeenCalledTimes(0)
		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(command,
			expect.objectContaining({ primaryKeyName: 'deviceId', sortKeyName: 'name' }),
			expect.objectContaining({
				defaultValue: { configKey: 'defaultHub', getItem: expect.any(Function), userMessage: expect.any(Function) },
				promptMessage: 'prompt message',
			}))
	})

	it('prefers command line over default', async () => {
		chooseOptionsWithDefaultsMock.mockReturnValueOnce({ allowIndex: false, useConfigDefault: true } as ChooseOptions<Device>)
		selectFromListMock.mockImplementation(async () => 'chosen-hub-id')

		expect(await chooseHub(command, 'prompt message', 'command-line-hub-id',
			{ useConfigDefault: true })).toBe('chosen-hub-id')

		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledTimes(1)
		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledWith({ useConfigDefault: true })
		expect(stringTranslateToIdMock).toHaveBeenCalledTimes(0)
		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(command,
			expect.objectContaining({ primaryKeyName: 'deviceId', sortKeyName: 'name' }),
			expect.objectContaining({
				preselectedId: 'command-line-hub-id',
				defaultValue: { configKey: 'defaultHub', getItem: expect.any(Function), userMessage: expect.any(Function) },
				promptMessage: 'prompt message',
			}))
	})

	it('translates id from index if allowed', async () => {
		chooseOptionsWithDefaultsMock.mockReturnValueOnce({ allowIndex: true } as ChooseOptions<Device>)
		stringTranslateToIdMock.mockResolvedValueOnce('translated-id')
		selectFromListMock.mockImplementation(async () => 'chosen-hub-id')

		expect(await chooseHub(command, 'prompt message', 'command-line-hub-id',
			{ useConfigDefault: true, allowIndex: true })).toBe('chosen-hub-id')

		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledTimes(1)
		expect(chooseOptionsWithDefaultsMock)
			.toHaveBeenCalledWith({ allowIndex: true, useConfigDefault: true })
		expect(stringTranslateToIdMock).toHaveBeenCalledTimes(1)
		expect(stringTranslateToIdMock).toHaveBeenCalledWith(
			expect.objectContaining({ primaryKeyName: 'deviceId', sortKeyName: 'name' }),
			'command-line-hub-id', expect.any(Function))
		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(command,
			expect.objectContaining({ primaryKeyName: 'deviceId', sortKeyName: 'name' }),
			expect.objectContaining({ preselectedId: 'translated-id', promptMessage: 'prompt message' }))
	})

	it('uses list function that specifies hubs', async () => {
		chooseOptionsWithDefaultsMock.mockReturnValueOnce({ allowIndex: false } as ChooseOptions<Device>)
		selectFromListMock.mockImplementation(async () => 'chosen-hub-id')

		expect(await chooseHub(command, 'prompt message', 'command-line-hub-id')).toBe('chosen-hub-id')

		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledTimes(1)
		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledWith(undefined)
		expect(stringTranslateToIdMock).toHaveBeenCalledTimes(0)
		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(command,
			expect.objectContaining({ primaryKeyName: 'deviceId', sortKeyName: 'name' }),
			expect.objectContaining({ preselectedId: 'command-line-hub-id', promptMessage: 'prompt message' }))

		const listItems = selectFromListMock.mock.calls[0][2].listItems

		const list = [{ name: 'Hub', locationId: 'locationId' }] as Device[]
		listDevicesMock.mockResolvedValueOnce(list)
		getLocationsMock.mockResolvedValueOnce({
			'allowed': [
				'd:locations',
			],
			'locationId': 'locationId',
		})

		expect(await listItems()).toStrictEqual(list)

		expect(listDevicesMock).toHaveBeenCalledTimes(1)
		expect(listDevicesMock).toHaveBeenCalledWith({ type: DeviceIntegrationType.HUB })
	})

	it('uses listItems from options', async () => {
		const listItemsMock = jest.fn()

		chooseOptionsWithDefaultsMock.mockReturnValueOnce({} as ChooseOptions<Device>)
		selectFromListMock.mockImplementation(async () => 'chosen-hub-id')

		expect(await chooseHub(command, 'prompt message', 'command-line-hub-id',
			{ listItems: listItemsMock })).toBe('chosen-hub-id')

		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledTimes(1)
		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledWith({ listItems: listItemsMock })
		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(command,
			expect.objectContaining({ primaryKeyName: 'deviceId', sortKeyName: 'name' }),
			expect.objectContaining({ listItems: listItemsMock }))
	})

	describe('listItems', () => {
		it('checks hub locations for ownership', async () => {
			chooseOptionsWithDefaultsMock.mockReturnValueOnce({ allowIndex: false } as ChooseOptions<Device>)
			selectFromListMock.mockImplementation(async () => 'chosen-hub-id')

			expect(await chooseHub(command, 'prompt message', 'command-line-hub-id')).toBe('chosen-hub-id')

			const hubList = [
				{ name: 'Hub', locationId: 'locationId' },
				{ name: 'AnotherHub', locationId: 'locationId' },
				{ name: 'SecondLocationHub', locationId: 'secondLocationId' },
			] as Device[]

			const location = {
				'allowed': [
					'd:locations',
				],
			} as Location

			listDevicesMock.mockResolvedValueOnce(hubList)
			getLocationsMock.mockResolvedValue(location)

			const listItems = selectFromListMock.mock.calls[0][2].listItems

			expect(await listItems()).toStrictEqual(hubList)

			expect(getLocationsMock).toBeCalledTimes(2)
			expect(getLocationsMock).toBeCalledWith('locationId', { allowed: true })
			expect(getLocationsMock).toBeCalledWith('secondLocationId', { allowed: true })
		})

		it('filters out devices on shared locations or when allowed is null, undefined', async () => {
			chooseOptionsWithDefaultsMock.mockReturnValueOnce({ allowIndex: false } as ChooseOptions<Device>)
			selectFromListMock.mockImplementation(async () => 'chosen-hub-id')

			expect(await chooseHub(command, 'prompt message', 'command-line-hub-id')).toBe('chosen-hub-id')

			const ownedHub = { name: 'Hub', locationId: 'locationId' }
			const hubList = [
				ownedHub,
				{ name: 'SharedHub', locationId: 'sharedLocationId' },
				{ name: 'NullAllowedHub', locationId: 'nullAllowedLocationId' },
				{ name: 'UndefinedAllowedHub', locationId: 'undefinedAllowedLocationId' },
			] as Device[]

			listDevicesMock.mockResolvedValueOnce(hubList)

			const location = {
				'allowed': [
					'd:locations',
				],
				'locationId': 'locationId',
			}

			const sharedLocation = {
				'allowed': [
				],
				'locationId': 'sharedLocationId',
			}

			const nullAllowedLocation = {
				'allowed': null,
				'locationId': 'nullAllowedLocationId',
			}

			const undefinedAllowedLocation = {
				'locationId': 'undefinedAllowedLocationId',
			}

			getLocationsMock
				.mockResolvedValueOnce(location)
				.mockResolvedValueOnce(sharedLocation)
				.mockResolvedValueOnce(nullAllowedLocation)
				.mockResolvedValueOnce(undefinedAllowedLocation)

			const listItems = selectFromListMock.mock.calls[0][2].listItems

			expect(await listItems()).toStrictEqual([ownedHub])

			expect(getLocationsMock).toBeCalledTimes(4)
			expect(command.logger.warn).toBeCalledWith('filtering out location', sharedLocation)
			expect(command.logger.warn).toBeCalledWith('filtering out location', nullAllowedLocation)
			expect(command.logger.warn).toBeCalledWith('filtering out location', undefinedAllowedLocation)
		})

		it('warns when hub does not have locationId', async () => {
			chooseOptionsWithDefaultsMock.mockReturnValueOnce({ allowIndex: false } as ChooseOptions<Device>)
			selectFromListMock.mockImplementation(async () => 'chosen-hub-id')

			expect(await chooseHub(command, 'prompt message', 'command-line-hub-id')).toBe('chosen-hub-id')

			const hub = { name: 'Hub' } as Device

			listDevicesMock.mockResolvedValueOnce([hub])

			const listItems = selectFromListMock.mock.calls[0][2].listItems

			expect(await listItems()).toStrictEqual([])

			expect(command.logger.warn).toBeCalledWith('hub record found without locationId', hub)
		})
	})

	describe('defaultConfig', () => {
		test('getItem uses devices.get', async () => {
			chooseOptionsWithDefaultsMock.mockReturnValueOnce({ allowIndex: false, useConfigDefault: true } as ChooseOptions<Device>)
			selectFromListMock.mockImplementation(async () => 'chosen-hub-id')

			expect(await chooseHub(command, 'prompt message', undefined,
				{ useConfigDefault: true })).toBe('chosen-hub-id')

			const defaultValue = selectFromListMock.mock.calls[0][2].defaultValue

			expect(defaultValue).toBeDefined()
			const getItem = defaultValue?.getItem as (id: string) => Promise<Device>
			expect(getItem).toBeDefined()
			getDevicesMock.mockResolvedValueOnce(hub)

			expect(await getItem('id-to-check')).toBe(hub)

			expect(getDevicesMock).toHaveBeenCalledTimes(1)
			expect(getDevicesMock).toHaveBeenCalledWith('id-to-check')
		})

		test('userMessage returns expected message', async () => {
			chooseOptionsWithDefaultsMock.mockReturnValueOnce({ allowIndex: false, useConfigDefault: true } as ChooseOptions<Device>)
			selectFromListMock.mockImplementation(async () => 'chosen-hub-id')

			expect(await chooseHub(command, 'prompt message', undefined,
				{ useConfigDefault: true })).toBe('chosen-hub-id')

			const defaultValue = selectFromListMock.mock.calls[0][2].defaultValue

			expect(defaultValue).toBeDefined()
			const userMessage = defaultValue?.userMessage as (hub: Device) => string
			expect(userMessage).toBeDefined()

			expect(userMessage(hub)).toBe('using previously specified default hub labeled "hub label" (hub-device-id)')
		})
	})
})

describe('listAssignedDriversWithNames', () => {
	const driverChannelDetailsList = [{ channelId: 'channel-id', driverId: 'driver-id' }] as
		unknown as DriverChannelDetails[]
	const listAssignedDriversMock = jest.fn()
	const getDriverChannelMetaInfoMock = jest.fn()
	const client = { channels: {
		listAssignedDrivers: listAssignedDriversMock,
		getDriverChannelMetaInfo: getDriverChannelMetaInfoMock,
	} } as unknown as SmartThingsClient

	it('lists drivers with their names', async () => {
		listAssignedDriversMock.mockReturnValueOnce(driverChannelDetailsList)
		getDriverChannelMetaInfoMock.mockResolvedValueOnce({ name: 'driver name' })

		const result = await listAssignedDriversWithNames(client, 'channel-id')

		expect(result).toEqual([{ channelId: 'channel-id', driverId: 'driver-id', name: 'driver name' }])

		expect(listAssignedDriversMock).toHaveBeenCalledTimes(1)
		expect(listAssignedDriversMock).toHaveBeenCalledWith('channel-id')
		expect(getDriverChannelMetaInfoMock).toHaveBeenCalledTimes(1)
		expect(getDriverChannelMetaInfoMock).toHaveBeenCalledWith('channel-id', 'driver-id')
	})

	it('skips deleted drivers', async () => {
		const driverChannelDetailsList = [
			{ channelId: 'channel-id', driverId: 'driver-id' },
			{ channelId: 'channel-id', driverId: 'deleted-driver-id' },
		] as unknown as DriverChannelDetails[]
		listAssignedDriversMock.mockReturnValueOnce(driverChannelDetailsList)
		getDriverChannelMetaInfoMock.mockResolvedValueOnce({ name: 'driver name' })
		getDriverChannelMetaInfoMock.mockRejectedValueOnce({ response: { status: 404 } })

		const result = await listAssignedDriversWithNames(client, 'channel-id')

		expect(result).toEqual([{ channelId: 'channel-id', driverId: 'driver-id', name: 'driver name' }])

		expect(listAssignedDriversMock).toHaveBeenCalledTimes(1)
		expect(listAssignedDriversMock).toHaveBeenCalledWith('channel-id')
		expect(getDriverChannelMetaInfoMock).toHaveBeenCalledTimes(2)
		expect(getDriverChannelMetaInfoMock).toHaveBeenCalledWith('channel-id', 'driver-id')
		expect(getDriverChannelMetaInfoMock).toHaveBeenCalledWith('channel-id', 'deleted-driver-id')
	})

	it('passes on other errors from getDriverChannelMetaInfo', async () => {
		listAssignedDriversMock.mockReturnValueOnce(driverChannelDetailsList)
		getDriverChannelMetaInfoMock.mockRejectedValueOnce(Error('random error'))

		await expect(listAssignedDriversWithNames(client, 'channel-id')).rejects.toThrow(Error('random error'))

		expect(listAssignedDriversMock).toHaveBeenCalledTimes(1)
		expect(listAssignedDriversMock).toHaveBeenCalledWith('channel-id')
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
