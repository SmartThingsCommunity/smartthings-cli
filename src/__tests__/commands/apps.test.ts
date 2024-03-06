import { jest } from '@jest/globals'

import { ArgumentsCamelCase, Argv, Options } from 'yargs'

import { AppClassification, AppResponse, AppType, AppsEndpoint, PagedApp, SmartThingsClient } from '@smartthings/core-sdk'

import { APICommand, APICommandFlags, apiCommand, apiCommandBuilder, apiDocsURL } from '../../lib/command/api-command.js'
import { outputItemOrList, outputItemOrListBuilder } from '../../lib/command/listing-io.js'
import { CommandArgs } from '../../commands/apps.js'
import { ListDataFunction } from '../../lib/command/basic-io.js'
import { BuildOutputFormatterFlags } from '../../lib/command/output-builder.js'
import { SmartThingsCommandFlags } from '../../lib/command/smartthings-command.js'
import { shortARNorURL, verboseApps } from '../../lib/command/util/apps-util.js'
import { buildArgvMock, buildArgvMockStub } from '../test-lib/builder-mock.js'



const apiCommandMock = jest.fn<typeof apiCommand>()
const apiCommandBuilderMock = jest.fn<typeof apiCommandBuilder>()
const apiDocsURLMock = jest.fn<typeof apiDocsURL>()
jest.unstable_mockModule('../../lib/command/api-command.js', () => ({
	apiCommand: apiCommandMock,
	apiCommandBuilder: apiCommandBuilderMock,
	apiDocsURL: apiDocsURLMock,
}))

const outputItemOrListMock = jest.fn<typeof outputItemOrList<PagedApp | AppResponse>>()
const outputItemOrListBuilderMock = jest.fn<typeof outputItemOrListBuilder>()
jest.unstable_mockModule('../../lib/command/listing-io.js', () => ({
	outputItemOrList: outputItemOrListMock,
	outputItemOrListBuilder: outputItemOrListBuilderMock,
}))

const shortARNorURLMock = jest.fn<typeof shortARNorURL>()
const verboseAppsMock = jest.fn<typeof verboseApps>()
jest.unstable_mockModule('../../lib/command/util/apps-util.js', () => ({
	shortARNorURL: shortARNorURLMock,
	verboseApps: verboseAppsMock,
	tableFieldDefinitions: [],
}))


const { default: cmd } = await import('../../commands/apps.js')


describe('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiCommandBuilderArgvMock,
		positionalMock,
		optionMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<SmartThingsCommandFlags, BuildOutputFormatterFlags>()

	apiCommandBuilderMock.mockReturnValue(apiCommandBuilderArgvMock)
	outputItemOrListBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	it('calls correct parent and yargs functions', () => {
		expect(builder(yargsMock)).toBe(argvMock)

		expect(apiCommandBuilderMock).toHaveBeenCalledTimes(1)
		expect(apiCommandBuilderMock).toHaveBeenCalledWith(yargsMock)
		expect(outputItemOrListBuilderMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListBuilderMock).toHaveBeenCalledWith(apiCommandBuilderArgvMock)
		expect(positionalMock).toHaveBeenCalledTimes(1)
		expect(optionMock).toHaveBeenCalledTimes(3)
		expect(exampleMock).toHaveBeenCalledTimes(1)
		expect(epilogMock).toHaveBeenCalledTimes(1)
	})

	// A simplified version of the type of the `Argv.option` that matches the way we call it.
	type OptionMock = jest.Mock<(key: string, options?: Options) => Argv<object & APICommandFlags>>

	it('accepts upper or lowercase types', () => {
		expect(builder(yargsMock)).toBe(argvMock)

		const typeCoerce = (optionMock as OptionMock).mock.calls[0][1]?.coerce
		expect(typeCoerce).toBeDefined()
		expect(typeCoerce?.('LAMBDA_SMART_APP')).toBe(AppType.LAMBDA_SMART_APP)
		expect(typeCoerce?.('lambda_smart_app')).toBe(AppType.LAMBDA_SMART_APP)
	})

	it('accepts upper or lowercase classifications', () => {
		expect(builder(yargsMock)).toBe(argvMock)

		const typeCoerce = (optionMock as OptionMock).mock.calls[1][1]?.coerce
		expect(typeCoerce).toBeDefined()
		expect(typeCoerce?.(undefined)).toBe(undefined)
		expect(typeCoerce?.([])).toStrictEqual([])
		expect(typeCoerce?.(['automation'])).toStrictEqual([AppClassification.AUTOMATION])
		expect(typeCoerce?.(['automation', 'SERVICE', 'Device']))
			.toStrictEqual([AppClassification.AUTOMATION, AppClassification.SERVICE, AppClassification.DEVICE])
	})
})

describe('handler', () => {
	const app = { appId: 'app-id', webhookSmartApp: { targetUrl: 'targetUrl' } } as AppResponse
	const appList = [{ appId: 'paged-app-id' }] as PagedApp[]

	const apiAppsListMock = jest.fn<typeof AppsEndpoint.prototype.list>()
		.mockResolvedValue(appList)
	const apiAppsGetMock = jest.fn<typeof AppsEndpoint.prototype.get>()
		.mockResolvedValue(app)
	const clientMock = {
		apps: {
			list: apiAppsListMock,
			get: apiAppsGetMock,
		},
	} as unknown as SmartThingsClient
	const command = {
		client: clientMock,
	} as APICommand<APICommandFlags>
	apiCommandMock.mockResolvedValue(command)

	const defaultInputArgv = {
		profile: 'default',
		verbose: false,
	} as ArgumentsCamelCase<CommandArgs>

	it('lists apps without args', async () => {
		await expect(cmd.handler(defaultInputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledTimes(1)
		expect(apiCommandMock).toHaveBeenCalledWith(defaultInputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			command,
			expect.objectContaining({ primaryKeyName: 'appId' }),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		apiAppsListMock.mockResolvedValueOnce(appList)
		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toStrictEqual(appList)

		expect(apiAppsListMock).toHaveBeenCalledTimes(1)
		expect(apiAppsListMock).toHaveBeenCalledWith({})
	})

	it('lists details of a specified app', async () => {
		const inputArgv = {
			...defaultInputArgv,
			idOrIndex: 'app-from-arg',
		} as ArgumentsCamelCase<CommandArgs>

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledTimes(1)
		expect(apiCommandMock).toHaveBeenCalledWith(inputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			command,
			expect.objectContaining({ primaryKeyName: 'appId' }),
			'app-from-arg',
			expect.any(Function),
			expect.any(Function),
		)

		const getFunction = outputItemOrListMock.mock.calls[0][4]

		expect(await getFunction('chosen-app-id')).toStrictEqual(app)

		expect(apiAppsGetMock).toHaveBeenCalledTimes(1)
		expect(apiAppsGetMock).toHaveBeenCalledWith('chosen-app-id')
	})

	const listAppsForArgs = async (args: Partial<ArgumentsCamelCase<CommandArgs>>): Promise<ListDataFunction<PagedApp | AppResponse>> => {
		await expect(cmd.handler({ ...defaultInputArgv, ...args })).resolves.not.toThrow()

		return outputItemOrListMock.mock.calls[0][3]
	}

	describe('listApps', () => {
		const appType = AppType.LAMBDA_SMART_APP
		const automation = AppClassification.AUTOMATION
		const service = AppClassification.SERVICE

		it('takes an app type to filter by via flags', async () => {
			const listItems = await listAppsForArgs({ type: appType })

			expect(await listItems()).toBe(appList)

			expect(apiAppsListMock).toHaveBeenCalledTimes(1)
			expect(apiAppsListMock).toHaveBeenCalledWith({ appType })
			expect(verboseAppsMock).toHaveBeenCalledTimes(0)
		})

		it('accepts a single classification for filtering', async () => {
			const listItems = await listAppsForArgs({ classification: [automation] })

			expect(await listItems()).toBe(appList)

			expect(apiAppsListMock).toHaveBeenCalledTimes(1)
			expect(apiAppsListMock).toHaveBeenCalledWith({ classification: [automation] })
			expect(verboseAppsMock).toHaveBeenCalledTimes(0)
		})

		it('accepts multiple classifications for filtering', async () => {
			const classifications = [automation, service]
			const listItems = await listAppsForArgs({ classification: classifications })

			expect(await listItems()).toBe(appList)

			expect(apiAppsListMock).toHaveBeenCalledTimes(1)
			expect(apiAppsListMock).toHaveBeenCalledWith({ classification: expect.arrayContaining(classifications) })
			expect(verboseAppsMock).toHaveBeenCalledTimes(0)
		})
	})

	it('includes URLs and ARNs in output when verbose flag is used', async () => {
		const listItems = await listAppsForArgs({ verbose: true })

		expect(outputItemOrListMock).toHaveBeenCalledWith(
			command,
			expect.objectContaining({
				listTableFieldDefinitions: expect.arrayContaining([{ label: 'ARN/URL', value: shortARNorURLMock }]),
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		const verboseAppList = [{ appId: 'verbose-app-id' }] as AppResponse[]
		verboseAppsMock.mockResolvedValue(verboseAppList)

		expect(await listItems()).toBe(verboseAppList)

		expect(apiAppsListMock).toHaveBeenCalledTimes(0)
		expect(verboseAppsMock).toHaveBeenCalledTimes(1)
		expect(verboseAppsMock).toHaveBeenCalledWith(clientMock, {})
	})
})
