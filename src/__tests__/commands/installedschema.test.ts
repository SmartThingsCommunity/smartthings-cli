import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { InstalledSchemaApp, SchemaEndpoint } from '@smartthings/core-sdk'

import type { withLocation, WithLocation } from '../../lib/api-helpers.js'
import type { APICommand, APICommandFlags } from '../../lib/command/api-command.js'
import type { outputItemOrList, outputItemOrListBuilder, OutputItemOrListFlags } from '../../lib/command/listing-io.js'
import type { SmartThingsCommandFlags } from '../../lib/command/smartthings-command.js'
import { type installedSchemaInstances, listTableFieldDefinitions, tableFieldDefinitions } from '../../lib/command/util/installedschema-util.js'
import type { CommandArgs } from '../../commands/installedschema.js'
import { apiCommandMocks } from '../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../test-lib/builder-mock.js'



const withLocationMock = jest.fn<typeof withLocation>()
jest.unstable_mockModule('../../lib/api-helpers.js', () => ({
	withLocation: withLocationMock,
}))

const { apiCommandMock, apiCommandBuilderMock, apiDocsURLMock } = apiCommandMocks('../..')

const outputItemOrListMock = jest.fn<typeof outputItemOrList<InstalledSchemaApp & WithLocation>>()
const outputItemOrListBuilderMock = jest.fn<typeof outputItemOrListBuilder>()
jest.unstable_mockModule('../../lib/command/listing-io.js', () => ({
	outputItemOrList: outputItemOrListMock,
	outputItemOrListBuilder: outputItemOrListBuilderMock,
}))

const installedSchemaInstancesMock = jest.fn<typeof installedSchemaInstances>()
jest.unstable_mockModule('../../lib/command/util/installedschema-util', () => ({
	installedSchemaInstances: installedSchemaInstancesMock,
	listTableFieldDefinitions,
	tableFieldDefinitions,
}))


const { default: cmd } = await import('../../commands/installedschema.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiCommandBuilderArgvMock,
		optionMock,
		positionalMock,
		exampleMock,
		argvMock,
		epilogMock,
	} = buildArgvMock<SmartThingsCommandFlags, OutputItemOrListFlags>()

	apiCommandBuilderMock.mockReturnValue(apiCommandBuilderArgvMock)
	outputItemOrListBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(outputItemOrListBuilderMock).toHaveBeenCalledExactlyOnceWith(apiCommandBuilderArgvMock)
	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(optionMock).toHaveBeenCalledTimes(2)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(apiDocsURLMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const installedSchemaApp = { endpointAppId: 'endpoint-app-id' } as InstalledSchemaApp
	const installedSchemaAppList = [installedSchemaApp] as InstalledSchemaApp[]
	const verboseInstalledApp =
		{ endpointAppId: 'verbose-installed-app-id' } as InstalledSchemaApp & WithLocation

	const apiSchemaGetInstalledAppMock = jest.fn<typeof SchemaEndpoint.prototype.getInstalledApp>()
		.mockResolvedValue(installedSchemaApp)
	const command = {
		client: {
			schema: {
				getInstalledApp: apiSchemaGetInstalledAppMock,
			},
		},
	} as unknown as APICommand<APICommandFlags>
	apiCommandMock.mockResolvedValue(command)

	const baseInputArgv = {
		profile: 'default',
		verbose: false,
	} as ArgumentsCamelCase<CommandArgs>

	it('lists installed schema apps without args', async () => {
		await expect(cmd.handler(baseInputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(baseInputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({
				primaryKeyName: 'isaId',
				listTableFieldDefinitions,
				tableFieldDefinitions,
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		installedSchemaInstancesMock.mockResolvedValueOnce(installedSchemaAppList)
		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toBe(installedSchemaAppList)

		expect(installedSchemaInstancesMock)
			.toHaveBeenCalledExactlyOnceWith(command.client, undefined, { verbose: false })
	})

	it('includes location with verbose flag', async () => {
		await expect(cmd.handler({ ...baseInputArgv, verbose: true })).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({
				listTableFieldDefinitions: expect.arrayContaining(['location', 'locationId']),
				tableFieldDefinitions: expect.arrayContaining(['location']),
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		const listFunction = outputItemOrListMock.mock.calls[0][3]
		const verboseInstalledAppsList = [verboseInstalledApp]
		installedSchemaInstancesMock.mockResolvedValueOnce(verboseInstalledAppsList)

		expect(await listFunction()).toBe(verboseInstalledAppsList)

		expect(installedSchemaInstancesMock)
			.toHaveBeenCalledExactlyOnceWith(command.client, undefined, { verbose: true })
	})

	it('lists details of a specified installed schema app', async () => {
		const inputArgv = {
			...baseInputArgv,
			idOrIndex: 'installed-schema-app-from-arg',
		} as ArgumentsCamelCase<CommandArgs>

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ primaryKeyName: 'isaId' }),
			'installed-schema-app-from-arg',
			expect.any(Function),
			expect.any(Function),
		)

		const getFunction = outputItemOrListMock.mock.calls[0][4]

		expect(await getFunction('chosen-schema-app-id')).toStrictEqual(installedSchemaApp)

		expect(apiSchemaGetInstalledAppMock).toHaveBeenCalledExactlyOnceWith('chosen-schema-app-id')

		expect(withLocationMock).not.toHaveBeenCalled()
	})

	it('includes location for single schema app with verbose flag', async () => {
		const inputArgv = {
			...baseInputArgv,
			idOrIndex: 'installed-schema-app-from-arg',
			verbose: true,
		} as ArgumentsCamelCase<CommandArgs>

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ tableFieldDefinitions: expect.arrayContaining(['location']) }),
			'installed-schema-app-from-arg',
			expect.any(Function),
			expect.any(Function),
		)

		const getFunction = outputItemOrListMock.mock.calls[0][4]
		withLocationMock.mockResolvedValueOnce(verboseInstalledApp)

		expect(await getFunction('chosen-schema-app-id')).toBe(verboseInstalledApp)

		expect(apiSchemaGetInstalledAppMock).toHaveBeenCalledExactlyOnceWith('chosen-schema-app-id')
		expect(withLocationMock).toHaveBeenCalledExactlyOnceWith(command.client, installedSchemaApp)
	})

	it('narrows by location when requested', async () => {
		await expect(cmd.handler({ ...baseInputArgv, location: ['location-id'] }))
			.resolves.not.toThrow()

		installedSchemaInstancesMock.mockResolvedValueOnce(installedSchemaAppList)
		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toBe(installedSchemaAppList)

		expect(installedSchemaInstancesMock)
			.toHaveBeenCalledExactlyOnceWith(command.client, ['location-id'], { verbose: false })
	})
})
