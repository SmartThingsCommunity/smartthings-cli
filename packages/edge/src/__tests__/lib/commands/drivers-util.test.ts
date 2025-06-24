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
