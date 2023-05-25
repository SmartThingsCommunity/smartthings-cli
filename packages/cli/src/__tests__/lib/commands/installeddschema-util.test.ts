import { InstalledSchemaApp, LocationsEndpoint, SchemaEndpoint, SmartThingsClient } from '@smartthings/core-sdk'

import { withLocations } from '@smartthings/cli-lib'

import { installedSchemaInstances } from '../../../lib/commands/installedschema-util.js'


describe('installedSchemaInstances', () => {
	const listMock = jest.fn()
	const locations = {
		list: listMock,
	} as unknown as LocationsEndpoint
	const installedAppsMock = jest.fn()
	const schema = {
		installedApps: installedAppsMock,
	} as unknown as SchemaEndpoint
	const client = {
		locations,
		schema,
	} as SmartThingsClient

	const withLocationsMock = jest.mocked(withLocations)

	const installedApp1 = { appName: 'Installed App 1', locationId: 'location-id-1' } as InstalledSchemaApp
	const installedApp2 = { appName: 'Installed App 2', locationId: 'location-id-1' } as InstalledSchemaApp
	const installedApp3 = { appName: 'Installed App 3', locationId: 'location-id-2' } as InstalledSchemaApp

	it('returns installed apps for specified locations', async () => {
		installedAppsMock.mockResolvedValueOnce([installedApp1])

		expect(await installedSchemaInstances(client, ['location-id'], false)).toStrictEqual([installedApp1])

		expect(listMock).toHaveBeenCalledTimes(0)
		expect(installedAppsMock).toHaveBeenCalledTimes(1)
		expect(installedAppsMock).toHaveBeenCalledWith('location-id')
		expect(withLocationsMock).toHaveBeenCalledTimes(0)
	})

	it('returns installed apps for all locations when no locations specified', async () => {
		listMock.mockResolvedValueOnce([{ locationId: 'location-id-1' }, { locationId: 'location-id-2' }])
		installedAppsMock.mockResolvedValueOnce([installedApp1, installedApp2])
		installedAppsMock.mockResolvedValueOnce([installedApp3])

		expect(await installedSchemaInstances(client, undefined, false))
			.toStrictEqual([installedApp1, installedApp2, installedApp3])

		expect(listMock).toHaveBeenCalledTimes(1)
		expect(listMock).toHaveBeenCalledWith()
		expect(installedAppsMock).toHaveBeenCalledTimes(2)
		expect(installedAppsMock).toHaveBeenCalledWith('location-id-1')
		expect(installedAppsMock).toHaveBeenCalledWith('location-id-2')
		expect(withLocationsMock).toHaveBeenCalledTimes(0)
	})

	it('returns installed apps for all locations when no locations specified via empty array', async () => {
		listMock.mockResolvedValueOnce([{ locationId: 'location-id-1' }, { locationId: 'location-id-2' }])
		installedAppsMock.mockResolvedValueOnce([installedApp1, installedApp2])
		installedAppsMock.mockResolvedValueOnce([installedApp3])

		expect(await installedSchemaInstances(client, [], false))
			.toStrictEqual([installedApp1, installedApp2, installedApp3])

		expect(listMock).toHaveBeenCalledTimes(1)
		expect(listMock).toHaveBeenCalledWith()
		expect(installedAppsMock).toHaveBeenCalledTimes(2)
		expect(installedAppsMock).toHaveBeenCalledWith('location-id-1')
		expect(installedAppsMock).toHaveBeenCalledWith('location-id-2')
		expect(withLocationsMock).toHaveBeenCalledTimes(0)
	})

	it('returns installed apps with locations when verbose is specified', async () => {
		const installedApp1WithLocation = { ...installedApp1, location: 'Location 1' }
		installedAppsMock.mockResolvedValueOnce([installedApp1])
		withLocationsMock.mockResolvedValueOnce([installedApp1WithLocation])

		expect(await installedSchemaInstances(client, ['location-id'], true)).toStrictEqual([installedApp1WithLocation])

		expect(listMock).toHaveBeenCalledTimes(0)
		expect(installedAppsMock).toHaveBeenCalledTimes(1)
		expect(installedAppsMock).toHaveBeenCalledWith('location-id')
		expect(withLocationsMock).toHaveBeenCalledTimes(1)
		expect(withLocationsMock).toHaveBeenCalledWith(client, [installedApp1])
	})
})
