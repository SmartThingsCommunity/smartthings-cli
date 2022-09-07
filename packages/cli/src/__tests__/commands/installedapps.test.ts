import { InstalledApp, InstalledAppsEndpoint, SmartThingsClient } from '@smartthings/core-sdk'

import { outputItemOrList, withLocation, withLocations, WithNamedLocation } from '@smartthings/cli-lib'

import InstalledAppsCommand from '../../commands/installedapps'
import { listTableFieldDefinitions, tableFieldDefinitions } from '../../lib/commands/installedapps-util'


const MOCK_INSTALLED_APP = { installedAppId: 'installedAppId' } as InstalledApp
const MOCK_INSTALLED_APP_LIST = [MOCK_INSTALLED_APP]
const MOCK_INSTALLED_APP_WITH_LOCATION = {
	installedAppId: 'installedAppId',
	location: 'location',
} as InstalledApp & WithNamedLocation

describe('InstalledAppsCommand', () => {
	const getSpy = jest.spyOn(InstalledAppsEndpoint.prototype, 'get').mockImplementation()
	const listSpy = jest.spyOn(InstalledAppsEndpoint.prototype, 'list').mockImplementation()

	const outputItemOrListMock = jest.mocked(outputItemOrList)
	const withLocationMock = jest.mocked(withLocation)
	const withLocationsMock = jest.mocked(withLocations)

	it('calls outputItemOrList with correct config', async () => {
		await expect(InstalledAppsCommand.run(['installedAppId'])).resolves.not.toThrow()

		expect(outputItemOrListMock).toBeCalledWith(
			expect.any(InstalledAppsCommand),
			expect.objectContaining({
				primaryKeyName: 'installedAppId',
				sortKeyName: 'displayName',
				listTableFieldDefinitions,
				tableFieldDefinitions,
			}),
			'installedAppId',
			expect.any(Function),
			expect.any(Function),
		)
	})

	it('calls correct get endpoint', async () => {
		await expect(InstalledAppsCommand.run([])).resolves.not.toThrow()

		getSpy.mockResolvedValueOnce(MOCK_INSTALLED_APP)

		const getFunction = outputItemOrListMock.mock.calls[0][4]

		await expect(getFunction('installedAppId')).resolves.toStrictEqual(MOCK_INSTALLED_APP)
		expect(getSpy).toBeCalledWith('installedAppId')
	})

	it('calls correct list endpoint', async () => {
		await expect(InstalledAppsCommand.run([])).resolves.not.toThrow()

		listSpy.mockResolvedValueOnce(MOCK_INSTALLED_APP_LIST)

		const listFunction = outputItemOrListMock.mock.calls[0][3]

		await expect(listFunction()).resolves.toEqual(MOCK_INSTALLED_APP_LIST)
		expect(listSpy).toBeCalledWith({ locationId: undefined })
	})

	it('accepts location-id flag to filter list', async () => {
		await expect(InstalledAppsCommand.run(['--location-id=locationId'])).resolves.not.toThrow()

		let listFunction = outputItemOrListMock.mock.calls[0][3]
		await listFunction()

		expect(listSpy).toBeCalledWith({ locationId: ['locationId'] })

		outputItemOrListMock.mockClear()
		listSpy.mockClear()

		await expect(InstalledAppsCommand.run(['-l=locationId', '-l=anotherLocationId'])).resolves.not.toThrow()

		listFunction = outputItemOrListMock.mock.calls[0][3]
		await listFunction()

		expect(listSpy).toBeCalledWith({ locationId: ['locationId', 'anotherLocationId'] })
	})

	it('includes location name when verbose flag is used', async () => {
		await expect(InstalledAppsCommand.run(['--verbose'])).resolves.not.toThrow()

		expect(outputItemOrListMock).toBeCalledWith(
			expect.any(InstalledAppsCommand),
			expect.objectContaining({
				listTableFieldDefinitions: expect.arrayContaining(['locationId', 'location']),
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		const expectedList = [MOCK_INSTALLED_APP_WITH_LOCATION]

		listSpy.mockResolvedValueOnce(MOCK_INSTALLED_APP_LIST)
		withLocationsMock.mockResolvedValueOnce(expectedList)
		const listFunction = outputItemOrListMock.mock.calls[0][3]

		await expect(listFunction()).resolves.toStrictEqual(expectedList)

		expect(listSpy).toBeCalledTimes(1)
		expect(withLocationsMock).toBeCalledWith(
			expect.any(SmartThingsClient),
			MOCK_INSTALLED_APP_LIST,
		)
	})

	it('includes location name when verbose flag is used for a single app', async () => {
		await expect(InstalledAppsCommand.run(['--verbose', 'installed-app-id-from-arg'])).resolves.not.toThrow()

		expect(outputItemOrListMock).toBeCalledWith(
			expect.any(InstalledAppsCommand),
			expect.objectContaining({
				tableFieldDefinitions: expect.arrayContaining(['location']),
			}),
			'installed-app-id-from-arg',
			expect.any(Function),
			expect.any(Function),
		)

		getSpy.mockResolvedValueOnce(MOCK_INSTALLED_APP)
		withLocationMock.mockResolvedValueOnce(MOCK_INSTALLED_APP_WITH_LOCATION)

		const getFunction = outputItemOrListMock.mock.calls[0][4]

		await expect(getFunction('installed-app-id')).resolves.toBe(MOCK_INSTALLED_APP_WITH_LOCATION)

		expect(getSpy).toBeCalledTimes(1)
		expect(getSpy).toBeCalledWith('installed-app-id')
		expect(withLocationMock).toBeCalledTimes(1)
		expect(withLocationMock).toBeCalledWith(expect.any(SmartThingsClient), MOCK_INSTALLED_APP)
	})
})
