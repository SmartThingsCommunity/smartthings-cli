import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import {
	type InstalledApp,
	type InstalledAppsEndpoint,
	type SmartThingsClient,
} from '@smartthings/core-sdk'

import type { withLocation, withLocations, WithLocation } from '../../lib/api-helpers.js'
import type { buildEpilog } from '../../lib/help.js'
import type { APICommand, APICommandFlags } from '../../lib/command/api-command.js'
import type { outputItemOrList, outputItemOrListBuilder } from '../../lib/command/listing-io.js'
import type { BuildOutputFormatterFlags } from '../../lib/command/output-builder.js'
import type { SmartThingsCommandFlags } from '../../lib/command/smartthings-command.js'
import { listTableFieldDefinitions } from '../../lib/command/util/installedapps-table.js'
import type { CommandArgs } from '../../commands/installedapps.js'
import { apiCommandMocks } from '../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../test-lib/builder-mock.js'
import { tableGeneratorMock } from '../test-lib/table-mock.js'


const withLocationMock = jest.fn<typeof withLocation>()
const withLocationsMock = jest.fn<typeof withLocations>()
jest.unstable_mockModule('../../lib/api-helpers.js', () => ({
	withLocation: withLocationMock,
	withLocations: withLocationsMock,
}))

const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks('../..')

const outputItemOrListMock = jest.fn<typeof outputItemOrList<InstalledApp & WithLocation>>()
const outputItemOrListBuilderMock = jest.fn<typeof outputItemOrListBuilder>()
jest.unstable_mockModule('../../lib/command/listing-io.js', () => ({
	outputItemOrList: outputItemOrListMock,
	outputItemOrListBuilder: outputItemOrListBuilderMock,
}))


const { default: cmd } = await import('../../commands/installedapps.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiCommandBuilderArgvMock,
		optionMock,
		positionalMock,
		exampleMock,
		argvMock,
		epilogMock,
	} = buildArgvMock<SmartThingsCommandFlags, BuildOutputFormatterFlags>()

	apiCommandBuilderMock.mockReturnValue(apiCommandBuilderArgvMock)
	outputItemOrListBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(outputItemOrListBuilderMock).toHaveBeenCalledExactlyOnceWith(apiCommandBuilderArgvMock)
	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(optionMock).toHaveBeenCalledTimes(2)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const installedApp = { installedAppId: 'installed-app-id' } as InstalledApp
	const installedAppList = [installedApp] as InstalledApp[]
	const verboseInstalledApp =
		{ installedAppId: 'verbose-installed-app-id' } as InstalledApp & WithLocation

	const apiInstalledAppsListMock = jest.fn<typeof InstalledAppsEndpoint.prototype.list>()
		.mockResolvedValue(installedAppList)
	const apiInstalledAppsGetMock = jest.fn<typeof InstalledAppsEndpoint.prototype.get>()
		.mockResolvedValue(installedApp)
	const clientMock = {
		installedApps: {
			list: apiInstalledAppsListMock,
			get: apiInstalledAppsGetMock,
		},
	} as unknown as SmartThingsClient
	const command = {
		client: clientMock,
		tableGenerator: tableGeneratorMock,
	} as APICommand<APICommandFlags>
	apiCommandMock.mockResolvedValue(command)

	const defaultInputArgv = {
		profile: 'default',
	} as ArgumentsCamelCase<CommandArgs>

	it('lists installedapps without args', async () => {
		await expect(cmd.handler(defaultInputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(defaultInputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({
				primaryKeyName: 'installedAppId',
				listTableFieldDefinitions,
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		apiInstalledAppsListMock.mockResolvedValueOnce(installedAppList)
		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toBe(installedAppList)

		expect(apiInstalledAppsListMock).toHaveBeenCalledExactlyOnceWith({ locationId: undefined })

		expect(withLocationsMock).not.toHaveBeenCalled()
	})

	it('includes location with verbose flag', async () => {
		await expect(cmd.handler({ ...defaultInputArgv, verbose: true })).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({
				listTableFieldDefinitions: expect.arrayContaining(['location', 'locationId']),
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		apiInstalledAppsListMock.mockResolvedValueOnce(installedAppList)
		const listFunction = outputItemOrListMock.mock.calls[0][3]
		const verboseInstalledAppsList = [verboseInstalledApp]
		withLocationsMock.mockResolvedValueOnce(verboseInstalledAppsList)

		expect(await listFunction()).toBe(verboseInstalledAppsList)

		expect(apiInstalledAppsListMock).toHaveBeenCalledExactlyOnceWith({ locationId: undefined })
		expect(withLocationsMock)
			.toHaveBeenCalledExactlyOnceWith(clientMock, installedAppList)
	})

	it('lists details of a specified installed app', async () => {
		const inputArgv = {
			...defaultInputArgv,
			idOrIndex: 'installed-app-from-arg',
		} as ArgumentsCamelCase<CommandArgs>

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ primaryKeyName: 'installedAppId' }),
			'installed-app-from-arg',
			expect.any(Function),
			expect.any(Function),
		)

		const getFunction = outputItemOrListMock.mock.calls[0][4]

		expect(await getFunction('chosen-app-id')).toStrictEqual(installedApp)

		expect(apiInstalledAppsGetMock).toHaveBeenCalledExactlyOnceWith('chosen-app-id')

		expect(withLocationMock).not.toHaveBeenCalled()
	})

	it('includes location for single app with verbose flag', async () => {
		const inputArgv = {
			...defaultInputArgv,
			idOrIndex: 'installed-app-from-arg',
			verbose: true,
		} as ArgumentsCamelCase<CommandArgs>

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ tableFieldDefinitions: expect.arrayContaining(['location']) }),
			'installed-app-from-arg',
			expect.any(Function),
			expect.any(Function),
		)

		const getFunction = outputItemOrListMock.mock.calls[0][4]
		withLocationMock.mockResolvedValueOnce(verboseInstalledApp)

		expect(await getFunction('chosen-app-id')).toBe(verboseInstalledApp)

		expect(apiInstalledAppsGetMock).toHaveBeenCalledExactlyOnceWith('chosen-app-id')
		expect(withLocationMock).toHaveBeenCalledExactlyOnceWith(command.client, installedApp)
	})

	it('narrows by location when requested', async () => {
		await expect(cmd.handler({ ...defaultInputArgv, location: 'location-id' }))
			.resolves.not.toThrow()

		apiInstalledAppsListMock.mockResolvedValueOnce(installedAppList)
		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toBe(installedAppList)

		expect(apiInstalledAppsListMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			locationId: 'location-id',
		}))
	})
})
