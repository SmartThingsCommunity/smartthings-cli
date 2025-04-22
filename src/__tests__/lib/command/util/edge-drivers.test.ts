import { jest } from '@jest/globals'

import {
	DriversEndpoint,
	EdgeDriverSummary,
	EdgeDeviceIntegrationProfileKey,
	EdgeDriver,
	EdgeDriverPermissions,
	SmartThingsClient,
	OrganizationResponse,
	DriverChannelDetails,
	ChannelsEndpoint,
} from '@smartthings/core-sdk'

import type { WithOrganization, forAllOrganizations } from '../../../../lib/api-helpers.js'
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

const apiDriversListMock = jest.fn<typeof DriversEndpoint.prototype.list>()
const client = {
	drivers: {
		list: apiDriversListMock,
	},
} as unknown as SmartThingsClient
const driverList = [{ name: 'Driver' }] as EdgeDriverSummary[]


const {
	buildTableOutput,
	listAssignedDriversWithNames,
	listDrivers,
	permissionsValue,
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
