import { jest } from '@jest/globals'

import {
	type ChannelsEndpoint,
	type Device,
	DeviceIntegrationType,
	type DevicesEndpoint,
	type DriverChannelDetails,
	type DriversEndpoint,
	type EdgeDeviceIntegrationProfileKey,
	type EdgeDriver,
	type EdgeDriverPermissions,
	type EdgeDriverSummary,
	type HubdevicesEndpoint,
	type InstalledDriver,
	type OrganizationResponse,
	type SmartThingsClient,
} from '@smartthings/core-sdk'

import type { WithOrganization, forAllOrganizations } from '../../../../lib/api-helpers.js'
import type { DeviceDriverInfo } from '../../../../lib/command/util/edge-drivers.js'
import {
	buildTableFromItemMock,
	buildTableFromListMock,
	mockedItemTableOutput,
	mockedListTableOutput,
	tableGeneratorMock,
} from '../../../test-lib/table-mock.js'


const forAllOrganizationsMock = jest.fn<typeof forAllOrganizations>()
jest.unstable_mockModule('../../../../lib/api-helpers.js', () => ({
	forAllOrganizations: forAllOrganizationsMock,
}))

const apiDevicesGetMock = jest.fn<typeof DevicesEndpoint.prototype.get>()
const apiDevicesListMock = jest.fn<typeof DevicesEndpoint.prototype.list>()
const apiDriversListMock = jest.fn<typeof DriversEndpoint.prototype.list>()
const apiDriversListDefaultMock = jest.fn<typeof DriversEndpoint.prototype.listDefault>()
const apiHubDevicesListInstalledMock = jest.fn<typeof HubdevicesEndpoint.prototype.listInstalled>()
const client = {
	devices: {
		get: apiDevicesGetMock,
		list: apiDevicesListMock,
	},
	drivers: {
		list: apiDriversListMock,
		listDefault: apiDriversListDefaultMock,
	},
	hubdevices: {
		listInstalled: apiHubDevicesListInstalledMock,
	},
} as unknown as SmartThingsClient
const driverList = [{ name: 'Driver' }] as EdgeDriverSummary[]


const {
	buildTableOutput,
	edgeDeviceTypes,
	getDriverDevices,
	listAllAvailableDrivers,
	listAssignedDriversWithNames,
	listDrivers,
	listMatchingDrivers,
	permissionsValue,
	withoutCurrentDriver,
} = await import('../../../../lib/command/util/edge-drivers.js')


describe('permissionsValue', () => {
	it('returns none with no permissions at all', () => {
		expect(permissionsValue({} as EdgeDriver)).toBe('none')
	})

	it('returns none with empty permissions array', () => {
		expect(permissionsValue({ permissions: [] as EdgeDriverPermissions[] } as EdgeDriver))
			.toBe('none')
	})

	it('combines permissions names', () => {
		expect(permissionsValue({ permissions: [
			{ name: 'r:locations' },
			{ name: 'r:devices' },
		] } as EdgeDriver)).toBe('r:locations\nr:devices')
	})
})

describe('buildTableOutput', () => {
	const minimalDriver: EdgeDriver = {
		driverId: 'driver-id',
		name: 'Driver Name',
		version: 'driver-version',
		packageKey: 'package key',
		deviceIntegrationProfiles: [{ id: 'profile-id' } as EdgeDeviceIntegrationProfileKey],
	}

	it('works with minimal fields', () => {
		expect(buildTableOutput(tableGeneratorMock, minimalDriver))
			.toBe(`Basic Information\n${mockedItemTableOutput}\n\n` +
				`Device Integration Profiles\n${mockedListTableOutput}\n\n` +
				'No fingerprints specified.')

		expect(buildTableFromItemMock).toHaveBeenCalledExactlyOnceWith(minimalDriver,
			expect.arrayContaining(['driverId', 'name', 'version', 'packageKey']))
		expect(buildTableFromListMock).toHaveBeenCalledExactlyOnceWith(
			minimalDriver.deviceIntegrationProfiles,
			['id', 'majorVersion'],
		)
	})

	it('includes fingerprints when specified', () => {
		const driver = { ...minimalDriver, fingerprints: [{ id: 'fingerprint-id' }] } as EdgeDriver
		expect(buildTableOutput(tableGeneratorMock, driver))
			.toBe(`Basic Information\n${mockedItemTableOutput}\n\n` +
				`Device Integration Profiles\n${mockedListTableOutput}\n\n` +
				`Fingerprints\n${mockedListTableOutput}`)

		expect(buildTableFromItemMock).toHaveBeenCalledExactlyOnceWith(driver,
			expect.arrayContaining(['driverId', 'name', 'version', 'packageKey']))
		expect(buildTableFromListMock).toHaveBeenCalledTimes(2)
		expect(buildTableFromListMock).toHaveBeenCalledWith(driver.deviceIntegrationProfiles,
			['id', 'majorVersion'])
		expect(buildTableFromListMock).toHaveBeenCalledWith(driver.fingerprints,
			['id', 'type', 'deviceLabel'])
	})
})

describe('listDrivers', () => {
	it('normally uses drivers.list', async () => {
		apiDriversListMock.mockResolvedValueOnce(driverList)

		expect(await listDrivers(client)).toBe(driverList)

		expect(apiDriversListMock).toHaveBeenCalledExactlyOnceWith()
		expect(forAllOrganizationsMock).toHaveBeenCalledTimes(0)
	})

	it('lists drivers for all organizations when requested', async () => {
		const withOrg = [{ name: 'driver', organization: 'organization-name' }] as
			(EdgeDriverSummary & WithOrganization)[]
		forAllOrganizationsMock.mockResolvedValueOnce(withOrg)

		expect(await listDrivers(client, true)).toBe(withOrg)

		expect(apiDriversListMock).toHaveBeenCalledTimes(0)
		expect(forAllOrganizationsMock).toHaveBeenCalledExactlyOnceWith(
			client,
			expect.any(Function),
		)

		const listDriversFunction = forAllOrganizationsMock.mock.calls[0][1]
		apiDriversListMock.mockResolvedValueOnce(driverList)

		expect(await listDriversFunction(client, { organizationId: 'unused' } as
			OrganizationResponse)).toBe(driverList)
		expect(apiDriversListMock).toHaveBeenCalledExactlyOnceWith()
	})
})

describe('listAssignedDriversWithNames', () => {
	const driverChannelDetailsList = [{ channelId: 'channel-id', driverId: 'driver-id' }] as
		unknown as DriverChannelDetails[]
	const apiChannelsListAssignedDriversMock = jest.fn<typeof ChannelsEndpoint.prototype.listAssignedDrivers>()
	const apiChannelsGetDriverChannelMetaInfoMock =
		jest.fn<typeof ChannelsEndpoint.prototype.getDriverChannelMetaInfo>()
	const client = {
		channels: {
			listAssignedDrivers: apiChannelsListAssignedDriversMock,
			getDriverChannelMetaInfo: apiChannelsGetDriverChannelMetaInfoMock,
		},
	} as unknown as SmartThingsClient

	const driver = { name: 'driver name' } as EdgeDriver

	it('lists drivers with their names', async () => {
		apiChannelsListAssignedDriversMock.mockResolvedValueOnce(driverChannelDetailsList)
		apiChannelsGetDriverChannelMetaInfoMock.mockResolvedValueOnce(driver)

		const result = await listAssignedDriversWithNames(client, 'channel-id')

		expect(result).toEqual([{ channelId: 'channel-id', driverId: 'driver-id', name: 'driver name' }])

		expect(apiChannelsListAssignedDriversMock).toHaveBeenCalledExactlyOnceWith('channel-id')
		expect(apiChannelsGetDriverChannelMetaInfoMock).toHaveBeenCalledExactlyOnceWith('channel-id', 'driver-id')
	})

	it('skips deleted drivers', async () => {
		const driverChannelDetailsList = [
			{ channelId: 'channel-id', driverId: 'driver-id' },
			{ channelId: 'channel-id', driverId: 'deleted-driver-id' },
		] as unknown as DriverChannelDetails[]
		apiChannelsListAssignedDriversMock.mockResolvedValueOnce(driverChannelDetailsList)
		apiChannelsGetDriverChannelMetaInfoMock.mockResolvedValueOnce(driver)
		apiChannelsGetDriverChannelMetaInfoMock.mockRejectedValueOnce({ response: { status: 404 } })

		const result = await listAssignedDriversWithNames(client, 'channel-id')

		expect(result).toEqual([{ channelId: 'channel-id', driverId: 'driver-id', name: 'driver name' }])

		expect(apiChannelsListAssignedDriversMock).toHaveBeenCalledExactlyOnceWith('channel-id')
		expect(apiChannelsGetDriverChannelMetaInfoMock).toHaveBeenCalledTimes(2)
		expect(apiChannelsGetDriverChannelMetaInfoMock).toHaveBeenCalledWith('channel-id', 'driver-id')
		expect(apiChannelsGetDriverChannelMetaInfoMock).toHaveBeenCalledWith('channel-id', 'deleted-driver-id')
	})

	it('passes on other errors from getDriverChannelMetaInfo', async () => {
		apiChannelsListAssignedDriversMock.mockResolvedValueOnce(driverChannelDetailsList)
		apiChannelsGetDriverChannelMetaInfoMock.mockRejectedValueOnce(Error('random error'))

		await expect(listAssignedDriversWithNames(client, 'channel-id')).rejects.toThrow(Error('random error'))

		expect(apiChannelsListAssignedDriversMock).toHaveBeenCalledExactlyOnceWith('channel-id')
	})
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
		const driverDevices: DeviceDriverInfo[] = [
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
		expect(apiDevicesListMock).toHaveBeenCalledWith({ type: edgeDeviceTypes })
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
		expect(apiDevicesListMock).toHaveBeenCalledWith({ type: edgeDeviceTypes })
	})
})

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

	expect(apiDevicesGetMock).toHaveBeenCalledExactlyOnceWith('device-id')
})

const installedDriver = { driverId: 'installed-driver-id', name: 'Installed Driver' } as InstalledDriver
const defaultDriver = { driverId: 'default-driver-id', name: 'Default Driver' } as EdgeDriverSummary
const currentDriver = { driverId: 'current-driver-id', name: 'Current Driver' } as InstalledDriver
const device = { zigbee: { driverId: 'current-driver-id' } } as Device

describe('listAllAvailableDrivers', () => {
	it('combines default and installed drivers lists', async () => {
		apiDevicesGetMock.mockResolvedValueOnce(device)

		apiHubDevicesListInstalledMock.mockResolvedValueOnce([installedDriver])
		apiDriversListDefaultMock.mockResolvedValueOnce([defaultDriver])

		const result = await listAllAvailableDrivers(client, 'device-id', 'hub-id')
		expect(result.length).toBe(2)
		expect(result).toEqual(expect.arrayContaining([defaultDriver, installedDriver]))

		expect(apiHubDevicesListInstalledMock).toHaveBeenCalledExactlyOnceWith('hub-id')
		expect(apiDriversListDefaultMock).toHaveBeenCalledExactlyOnceWith()
		expect(apiDevicesGetMock).toHaveBeenCalledExactlyOnceWith('device-id')
	})

	it('filters out current driver', async () => {
		apiDevicesGetMock.mockResolvedValueOnce(device)

		apiHubDevicesListInstalledMock.mockResolvedValueOnce([installedDriver, currentDriver])
		apiDriversListDefaultMock.mockResolvedValueOnce([defaultDriver])

		const result = await listAllAvailableDrivers(client, 'device-id', 'hub-id')
		expect(result.length).toBe(2)
		expect(result).toEqual(expect.arrayContaining([defaultDriver, installedDriver]))

		expect(apiHubDevicesListInstalledMock).toHaveBeenCalledExactlyOnceWith('hub-id')
		expect(apiDriversListDefaultMock).toHaveBeenCalledExactlyOnceWith()
		expect(apiDevicesGetMock).toHaveBeenCalledExactlyOnceWith('device-id')
	})

	it('filters out duplicates', async () => {
		apiDevicesGetMock.mockResolvedValueOnce(device)

		apiHubDevicesListInstalledMock.mockResolvedValueOnce([installedDriver, defaultDriver as unknown as InstalledDriver])
		apiDriversListDefaultMock.mockResolvedValueOnce([defaultDriver])

		const result = await listAllAvailableDrivers(client, 'device-id', 'hub-id')
		expect(result.length).toBe(2)
		expect(result).toEqual(expect.arrayContaining([defaultDriver, installedDriver]))

		expect(apiHubDevicesListInstalledMock).toHaveBeenCalledExactlyOnceWith('hub-id')
		expect(apiDriversListDefaultMock).toHaveBeenCalledExactlyOnceWith()
		expect(apiDevicesGetMock).toHaveBeenCalledExactlyOnceWith('device-id')
	})
})

describe('listMatchingDrivers', () => {
	it('lists matching drivers', async () => {
		apiHubDevicesListInstalledMock.mockResolvedValueOnce([installedDriver])
		apiDevicesGetMock.mockResolvedValueOnce(device)

		expect(await listMatchingDrivers(client, 'device-id', 'hub-id'))
			.toStrictEqual([installedDriver])

		expect(apiHubDevicesListInstalledMock).toHaveBeenCalledExactlyOnceWith('hub-id', 'device-id')
		expect(apiDevicesGetMock).toHaveBeenCalledExactlyOnceWith('device-id')
	})

	it('filters out current driver', async () => {
		apiHubDevicesListInstalledMock.mockResolvedValueOnce([installedDriver, currentDriver])
		apiDevicesGetMock.mockResolvedValueOnce(device)

		expect(await listMatchingDrivers(client, 'device-id', 'hub-id'))
			.toStrictEqual([installedDriver])

		expect(apiHubDevicesListInstalledMock).toHaveBeenCalledExactlyOnceWith('hub-id', 'device-id')
		expect(apiDevicesGetMock).toHaveBeenCalledExactlyOnceWith('device-id')
	})
})
