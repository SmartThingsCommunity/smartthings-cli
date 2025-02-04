import { jest } from '@jest/globals'

import type {
	InstalledSchemaApp,
	Location,
	LocationsEndpoint,
	SchemaEndpoint,
	SmartThingsClient,
} from '@smartthings/core-sdk'

import type { withLocations } from '../../../../lib/api-helpers.js'


const withLocationsMock = jest.fn<typeof withLocations<InstalledSchemaApp>>()
jest.unstable_mockModule('../../../../lib/api-helpers.js', () => ({
	withLocations: withLocationsMock,
}))


const { installedSchemaInstances } = await import('../../../../lib/command/util/installedschema-util.js')


describe('installedSchemaInstances', () => {
	const apiLocationsListMock = jest.fn<typeof LocationsEndpoint.prototype.list>()
	const apiSchemaInstalledAppsMock = jest.fn<typeof SchemaEndpoint.prototype.installedApps>()

	const client = {
		locations: {
			list: apiLocationsListMock,
		},
		schema: {
			installedApps: apiSchemaInstalledAppsMock,
		},
	} as unknown as SmartThingsClient

	const locations = [{ locationId: 'location-id-1' }, { locationId: 'location-id-2' }] as Location[]

	const installedApp1 = { appName: 'Installed App 1', locationId: 'location-id-1' } as InstalledSchemaApp
	const installedApp2 = { appName: 'Installed App 2', locationId: 'location-id-1' } as InstalledSchemaApp
	const installedApp3 = { appName: 'Installed App 3', locationId: 'location-id-2' } as InstalledSchemaApp

	it('returns installed apps for specified locations', async () => {
		apiSchemaInstalledAppsMock.mockResolvedValueOnce([installedApp1])

		expect(await installedSchemaInstances(client, ['location-id'], { verbose: false }))
			.toStrictEqual([installedApp1])

		expect(apiSchemaInstalledAppsMock).toHaveBeenCalledExactlyOnceWith('location-id')

		expect(apiLocationsListMock).not.toHaveBeenCalled()
		expect(withLocationsMock).not.toHaveBeenCalled()
	})

	it.each(
		[undefined, []],
	)('returns installed apps for all locations when no locations specified', async (requestedLocations) => {
		apiLocationsListMock.mockResolvedValueOnce(locations)
		apiSchemaInstalledAppsMock.mockResolvedValueOnce([installedApp1, installedApp2])
		apiSchemaInstalledAppsMock.mockResolvedValueOnce([installedApp3])

		expect(await installedSchemaInstances(client, requestedLocations, { verbose: false }))
			.toStrictEqual([installedApp1, installedApp2, installedApp3])

		expect(apiLocationsListMock).toHaveBeenCalledExactlyOnceWith()
		expect(apiSchemaInstalledAppsMock).toHaveBeenCalledTimes(2)
		expect(apiSchemaInstalledAppsMock).toHaveBeenCalledWith('location-id-1')
		expect(apiSchemaInstalledAppsMock).toHaveBeenCalledWith('location-id-2')

		expect(withLocationsMock).not.toHaveBeenCalled()
	})

	it('returns installed apps with locations when verbose is specified', async () => {
		const installedApp1WithLocation = { ...installedApp1, location: 'Location 1' }
		apiSchemaInstalledAppsMock.mockResolvedValueOnce([installedApp1])
		withLocationsMock.mockResolvedValueOnce([installedApp1WithLocation])

		expect(await installedSchemaInstances(client, ['location-id'], { verbose: true }))
			.toStrictEqual([installedApp1WithLocation])

		expect(apiSchemaInstalledAppsMock).toHaveBeenCalledExactlyOnceWith('location-id')
		expect(withLocationsMock).toHaveBeenCalledExactlyOnceWith(client, [installedApp1])

		expect(apiLocationsListMock).not.toHaveBeenCalled()
	})
})
