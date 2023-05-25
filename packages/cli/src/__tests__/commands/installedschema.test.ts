import { SchemaApp, SchemaEndpoint, SmartThingsClient } from '@smartthings/core-sdk'

import { outputItemOrList, withLocation } from '@smartthings/cli-lib'

import InstalledSchemaAppsCommand from '../../commands/installedschema.js'
import { installedSchemaInstances } from '../../lib/commands/installedschema-util.js'


jest.mock('../../lib/commands/installedschema-util', () => {
	const originalLib = jest.requireActual('../../lib/commands/installedschema-util')

	return {
		...originalLib,
		installedSchemaInstances: jest.fn(),
	}
})

describe('InstalledSchemaAppsCommand', () => {
	const outputItemOrListMock = jest.mocked(outputItemOrList)
	const withLocationMock = jest.mocked(withLocation)

	const getInstalledAppSpy = jest.spyOn(SchemaEndpoint.prototype, 'getInstalledApp').mockImplementation()

	const installedSchemaInstancesMock = jest.mocked(installedSchemaInstances)

	const schemaApp = { appName: 'A Schema App' } as SchemaApp
	const schemaApps = [schemaApp]
	const schemaAppWithLocation = { ...schemaApp, location: 'Location Name' }

	it('lists schema apps', async () => {
		await expect(InstalledSchemaAppsCommand.run([])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			expect.any(InstalledSchemaAppsCommand),
			expect.objectContaining({
				primaryKeyName: 'isaId',
				listTableFieldDefinitions: expect.not.arrayContaining(['location']),
				tableFieldDefinitions: expect.not.arrayContaining(['location']),
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		installedSchemaInstancesMock.mockResolvedValueOnce(schemaApps)

		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toBe(schemaApps)

		expect(installedSchemaInstancesMock).toHaveBeenCalledTimes(1)
		expect(installedSchemaInstancesMock)
			.toHaveBeenCalledWith(expect.any(SmartThingsClient), undefined, undefined)
	})

	it('includes location with verbose flag', async () => {
		await expect(InstalledSchemaAppsCommand.run(['--verbose'])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			expect.any(InstalledSchemaAppsCommand),
			expect.objectContaining({
				primaryKeyName: 'isaId',
				listTableFieldDefinitions: expect.arrayContaining(['locationId', 'location']),
				tableFieldDefinitions: expect.arrayContaining(['locationId', 'location']),
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		installedSchemaInstancesMock.mockResolvedValueOnce(schemaApps)

		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toBe(schemaApps)

		expect(installedSchemaInstancesMock).toHaveBeenCalledTimes(1)
		expect(installedSchemaInstancesMock)
			.toHaveBeenCalledWith(expect.any(SmartThingsClient), undefined, true)
	})

	it('displays single schema app', async () => {
		await expect(InstalledSchemaAppsCommand.run(['id-from-command-line'])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			expect.any(InstalledSchemaAppsCommand),
			expect.objectContaining({
				primaryKeyName: 'isaId',
				listTableFieldDefinitions: expect.not.arrayContaining(['location']),
				tableFieldDefinitions: expect.not.arrayContaining(['location']),
			}),
			'id-from-command-line',
			expect.any(Function),
			expect.any(Function),
		)

		getInstalledAppSpy.mockResolvedValueOnce(schemaApp)

		const getFunction = outputItemOrListMock.mock.calls[0][4]

		expect(await getFunction('installed-app-id')).toBe(schemaApp)

		expect(getInstalledAppSpy).toHaveBeenCalledTimes(1)
		expect(getInstalledAppSpy).toHaveBeenCalledWith('installed-app-id')
		expect(withLocationMock).toHaveBeenCalledTimes(0)
	})

	it('includes location with verbose flag for single app', async () => {
		await expect(InstalledSchemaAppsCommand.run(['--verbose', 'id-from-command-line'])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			expect.any(InstalledSchemaAppsCommand),
			expect.objectContaining({
				primaryKeyName: 'isaId',
				listTableFieldDefinitions: expect.arrayContaining(['locationId', 'location']),
				tableFieldDefinitions: expect.arrayContaining(['locationId', 'location']),
			}),
			'id-from-command-line',
			expect.any(Function),
			expect.any(Function),
		)

		getInstalledAppSpy.mockResolvedValueOnce(schemaApp)
		withLocationMock.mockResolvedValue(schemaAppWithLocation)

		const getFunction = outputItemOrListMock.mock.calls[0][4]

		expect(await getFunction('installed-app-id')).toBe(schemaAppWithLocation)

		expect(getInstalledAppSpy).toHaveBeenCalledTimes(1)
		expect(getInstalledAppSpy).toHaveBeenCalledWith('installed-app-id')
		expect(withLocationMock).toHaveBeenCalledTimes(1)
		expect(withLocationMock).toHaveBeenCalledWith(expect.any(SmartThingsClient), schemaApp)
	})
})
