import { jest } from '@jest/globals'

import { InstalledApp, InstalledAppListOptions, InstalledAppsEndpoint, type SmartThingsClient } from '@smartthings/core-sdk'

import type { WithLocation, withLocations, WithNamedLocation } from '../../../../lib/api-helpers.js'
import type { ChooseFunction, createChooseFn } from '../../../../lib/command/util/util-util.js'


const withLocationsMock = jest.fn<typeof withLocations>()
jest.unstable_mockModule('../../../../lib/api-helpers.js', () => ({
	withLocations: withLocationsMock,
}))

const createChooseFnMock = jest.fn<typeof createChooseFn<InstalledApp & WithLocation>>()
jest.unstable_mockModule('../../../../lib/command/util/util-util.js', () => ({
	createChooseFn: createChooseFnMock,
}))


const { chooseInstalledAppFn } = await import('../../../../lib/command/util/installedapps-util.js')


describe('chooseInstalledAppFn', () => {
	const installedApp1 = { installedAppId: 'installed-app-1' } as InstalledApp
	const installedApp2 = { installedAppId: 'installed-app-2' } as InstalledApp
	const installedApps = [installedApp1, installedApp2]
	const apiInstalledAppsListMock = jest.fn<typeof InstalledAppsEndpoint.prototype.list>()
		.mockResolvedValue(installedApps)
	const client = {
		installedApps: {
			list: apiInstalledAppsListMock,
		},
	} as unknown as SmartThingsClient

	const chooseInstalledAppMock = jest.fn<ChooseFunction<InstalledApp & WithLocation>>()
	createChooseFnMock.mockReturnValue(chooseInstalledAppMock)

	it('creates a non-verbose, all-location list by default', async () => {
		expect(chooseInstalledAppFn()).toBe(chooseInstalledAppMock)

		expect(createChooseFnMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({
				itemName: 'installed app',
				listTableFieldDefinitions: expect.not.arrayContaining(['location']),
			}),
			expect.any(Function),
		)

		const listFunction = createChooseFnMock.mock.calls[0][1]

		expect(await listFunction(client)).toBe(installedApps)

		expect(apiInstalledAppsListMock).toHaveBeenCalledExactlyOnceWith(undefined)
		expect(withLocationsMock).not.toHaveBeenCalled()
	})

	it('includes location name when verbose is specified', async () => {
		const listOptions: InstalledAppListOptions = { deviceId: 'test-device-id' }
		expect(chooseInstalledAppFn({ verbose: true, listOptions })).toBe(chooseInstalledAppMock)

		expect(createChooseFnMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({
				itemName: 'installed app',
				listTableFieldDefinitions: expect.arrayContaining(['location']),
			}),
			expect.any(Function),
		)

		const listFunction = createChooseFnMock.mock.calls[0][1]

		const installedAppsWithLocations = [
			{ installedAppId: 'installed-app-id-1', location: 'here and there' } as InstalledApp & WithNamedLocation,
			{ installedAppId: 'installed-app-id-2', location: 'there and here' } as InstalledApp & WithNamedLocation,
		]
		withLocationsMock.mockResolvedValue(installedAppsWithLocations)

		expect(await listFunction(client)).toBe(installedAppsWithLocations)

		expect(apiInstalledAppsListMock).toHaveBeenCalledExactlyOnceWith(listOptions)
		expect(withLocationsMock).toHaveBeenCalledExactlyOnceWith(client, installedApps)
	})
})
