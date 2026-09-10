import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv, Options } from 'yargs'

import {
	type HttpClientHeaders,
	type OrganizationResponse,
	type PagedSmartApp,
	type SmartAppResponse,
	type SmartAppsEndpoint,
	type SmartThingsClient,
} from '@smartthings/core-sdk'

import type { forAllOrganizations } from '../../lib/api-helpers.js'
import type { buildEpilog } from '../../lib/help.js'
import type {
	APIOrganizationCommand,
	APIOrganizationCommandFlags,
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
} from '../../lib/command/api-organization-command.js'
import type { AllOrganizationFlags, allOrganizationsBuilder } from '../../lib/command/common-flags.js'
import type { outputItemOrList, outputItemOrListBuilder } from '../../lib/command/listing-io.js'
import type { CommandArgs } from '../../commands/smartapps.js'
import type { ListDataFunction } from '../../lib/command/io-defs.js'
import type { BuildOutputFormatterFlags } from '../../lib/command/output-builder.js'
import type {
	paidAccountRequiredHandler,
	shortARNorURL,
	verboseSmartApps,
} from '../../lib/command/util/smartapps-util.js'
import { buildArgvMock, buildArgvMockStub } from '../test-lib/builder-mock.js'


const forAllOrganizationsMock = jest.fn<typeof forAllOrganizations>()
jest.unstable_mockModule('../../lib/api-helpers.js', () => ({
	forAllOrganizations: forAllOrganizationsMock,
}))

const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const apiOrganizationCommandMock = jest.fn<typeof apiOrganizationCommand>()
const apiOrganizationCommandBuilderMock = jest.fn<typeof apiOrganizationCommandBuilder>()
jest.unstable_mockModule('../../lib/command/api-organization-command.js', () => ({
	apiOrganizationCommand: apiOrganizationCommandMock,
	apiOrganizationCommandBuilder: apiOrganizationCommandBuilderMock,
}))

const allOrganizationsBuilderMock = jest.fn<typeof allOrganizationsBuilder>()
jest.unstable_mockModule('../../lib/command/common-flags.js', () => ({
	allOrganizationsBuilder: allOrganizationsBuilderMock,
}))

const outputItemOrListMock = jest.fn<typeof outputItemOrList<PagedSmartApp | SmartAppResponse>>()
const outputItemOrListBuilderMock = jest.fn<typeof outputItemOrListBuilder>()
jest.unstable_mockModule('../../lib/command/listing-io.js', () => ({
	outputItemOrList: outputItemOrListMock,
	outputItemOrListBuilder: outputItemOrListBuilderMock,
}))

const paidAccountRequiredErrorHandlerMock = jest.fn<ReturnType<typeof paidAccountRequiredHandler>>()
	.mockImplementation(() => { throw Error('should exit') })
const paidAccountRequiredHandlerMock = jest.fn<typeof paidAccountRequiredHandler>()
	.mockReturnValue(paidAccountRequiredErrorHandlerMock)
const shortARNorURLMock = jest.fn<typeof shortARNorURL>()
const verboseSmartAppsMock = jest.fn<typeof verboseSmartApps>()
jest.unstable_mockModule('../../lib/command/util/smartapps-util.js', () => ({
	paidAccountRequiredHandler: paidAccountRequiredHandlerMock,
	shortARNorURL: shortARNorURLMock,
	verboseSmartApps: verboseSmartAppsMock,
}))


const { default: cmd } = await import('../../commands/smartapps.js')


describe('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const apiCommandBuilderArgvMock = buildArgvMockStub<APIOrganizationCommandFlags>()
	const {
		yargsMock: allOrganizationsBuilderArgvMock,
		positionalMock,
		optionMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APIOrganizationCommandFlags & AllOrganizationFlags, BuildOutputFormatterFlags>()

	apiOrganizationCommandBuilderMock.mockReturnValue(apiCommandBuilderArgvMock)
	allOrganizationsBuilderMock.mockReturnValue(allOrganizationsBuilderArgvMock)
	outputItemOrListBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	it('calls correct parent and yargs functions', () => {
		expect(builder(yargsMock)).toBe(argvMock)

		expect(apiOrganizationCommandBuilderMock).toHaveBeenCalledTimes(1)
		expect(apiOrganizationCommandBuilderMock).toHaveBeenCalledWith(yargsMock)
		expect(allOrganizationsBuilderMock).toHaveBeenCalledTimes(1)
		expect(allOrganizationsBuilderMock).toHaveBeenCalledWith(apiCommandBuilderArgvMock)
		expect(outputItemOrListBuilderMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListBuilderMock).toHaveBeenCalledWith(allOrganizationsBuilderArgvMock)
		expect(positionalMock).toHaveBeenCalledTimes(1)
		expect(optionMock).toHaveBeenCalledTimes(3)
		expect(exampleMock).toHaveBeenCalledTimes(1)
		expect(buildEpilogMock).toHaveBeenCalledTimes(1)
		expect(epilogMock).toHaveBeenCalledTimes(1)
	})

	// A simplified version of the type of the `Argv.option` that matches the way we call it.
	type OptionMock = jest.Mock<(key: string, options?: Options) => Argv<object & APIOrganizationCommandFlags>>

	it('accepts upper or lowercase types', () => {
		expect(builder(yargsMock)).toBe(argvMock)

		const typeCoerce = (optionMock as OptionMock).mock.calls[0][1]?.coerce
		expect(typeCoerce).toBeDefined()
		expect(typeCoerce?.('API_ONLY')).toBe('API_ONLY')
		expect(typeCoerce?.('api_only')).toBe('API_ONLY')
	})

	it('accepts upper or lowercase classifications', () => {
		expect(builder(yargsMock)).toBe(argvMock)

		const typeCoerce = (optionMock as OptionMock).mock.calls[1][1]?.coerce
		expect(typeCoerce).toBeDefined()
		expect(typeCoerce?.(undefined)).toBe(undefined)
		expect(typeCoerce?.([])).toStrictEqual([])
		expect(typeCoerce?.(['automation'])).toStrictEqual(['AUTOMATION'])
		expect(typeCoerce?.(['automation', 'SERVICE', 'Device']))
			.toStrictEqual(['AUTOMATION', 'SERVICE', 'DEVICE'])
	})
})

describe('handler', () => {
	const app = { appId: 'app-id', webhookSmartApp: { targetUrl: 'targetUrl' } } as SmartAppResponse
	const appList = [{ appId: 'paged-app-id' }] as PagedSmartApp[]

	const apiAppsListMock = jest.fn<typeof SmartAppsEndpoint.prototype.list>()
		.mockResolvedValue(appList)
	const apiAppsGetMock = jest.fn<typeof SmartAppsEndpoint.prototype.get>()
		.mockResolvedValue(app)
	const clientMock = {
		smartapps: {
			list: apiAppsListMock,
			get: apiAppsGetMock,
		},
		config: { headers: {} as HttpClientHeaders },
	} as unknown as SmartThingsClient
	const command = {
		client: clientMock,
	} as unknown as APIOrganizationCommand<APIOrganizationCommandFlags>
	apiOrganizationCommandMock.mockResolvedValue(command)

	const defaultInputArgv = {
		profile: 'default',
		verbose: false,
	} as ArgumentsCamelCase<CommandArgs>

	it('lists apps without args', async () => {
		await expect(cmd.handler(defaultInputArgv)).resolves.not.toThrow()

		expect(apiOrganizationCommandMock).toHaveBeenCalledTimes(1)
		expect(apiOrganizationCommandMock).toHaveBeenCalledWith(defaultInputArgv)
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

		expect(apiOrganizationCommandMock).toHaveBeenCalledTimes(1)
		expect(apiOrganizationCommandMock).toHaveBeenCalledWith(inputArgv)
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

	const listAppsForArgs = async (
			args: Partial<ArgumentsCamelCase<CommandArgs>>,
	): Promise<ListDataFunction<PagedSmartApp | SmartAppResponse>> => {
		await expect(cmd.handler({ ...defaultInputArgv, ...args })).resolves.not.toThrow()

		return outputItemOrListMock.mock.calls[0][3]
	}

	describe('listApps', () => {
		const appType = 'LAMBDA_SMART_APP'
		const automation = 'AUTOMATION' as const
		const service = 'SERVICE' as const

		it('takes an app type to filter by via flags', async () => {
			const listItems = await listAppsForArgs({ type: appType })

			expect(await listItems()).toBe(appList)

			expect(apiAppsListMock).toHaveBeenCalledTimes(1)
			expect(apiAppsListMock).toHaveBeenCalledWith({ appType })
			expect(verboseSmartAppsMock).toHaveBeenCalledTimes(0)
		})

		it('accepts a single classification for filtering', async () => {
			const listItems = await listAppsForArgs({ classification: [automation] })

			expect(await listItems()).toBe(appList)

			expect(apiAppsListMock).toHaveBeenCalledTimes(1)
			expect(apiAppsListMock).toHaveBeenCalledWith({ classification: [automation] })
			expect(verboseSmartAppsMock).toHaveBeenCalledTimes(0)
		})

		it('accepts multiple classifications for filtering', async () => {
			const classifications = [automation, service]
			const listItems = await listAppsForArgs({ classification: classifications })

			expect(await listItems()).toBe(appList)

			expect(apiAppsListMock).toHaveBeenCalledTimes(1)
			expect(apiAppsListMock).toHaveBeenCalledWith({ classification: expect.arrayContaining(classifications) })
			expect(verboseSmartAppsMock).toHaveBeenCalledTimes(0)
		})

		it('passes the organization set on the client headers as accountId', async () => {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			clientMock.config.headers = { 'X-ST-Organization': 'organization-id' }

			const listItems = await listAppsForArgs({})

			expect(await listItems()).toBe(appList)

			expect(apiAppsListMock).toHaveBeenCalledTimes(1)
			expect(apiAppsListMock).toHaveBeenCalledWith({ accountId: 'organization-id' })
			expect(verboseSmartAppsMock).toHaveBeenCalledTimes(0)
		})

		it('uses paid account required handler for errors', async () => {
			const listItems = await listAppsForArgs({})

			const error = { response: { status: 403 } }
			apiAppsListMock.mockRejectedValueOnce(error)

			await expect(listItems()).rejects.toThrow('should exit')

			expect(paidAccountRequiredHandlerMock).toHaveBeenCalledExactlyOnceWith('Listing Smart Apps')
			expect(paidAccountRequiredErrorHandlerMock).toHaveBeenCalledExactlyOnceWith(error)
		})

		it('uses paid account required handler for errors in verbose mode', async () => {
			const listItems = await listAppsForArgs({ verbose: true })

			const error = { response: { status: 403 } }
			verboseSmartAppsMock.mockRejectedValueOnce(error)

			await expect(listItems()).rejects.toThrow('should exit')

			expect(paidAccountRequiredHandlerMock).toHaveBeenCalledExactlyOnceWith('Listing Smart Apps')
			expect(paidAccountRequiredErrorHandlerMock).toHaveBeenCalledExactlyOnceWith(error)
		})

		it('omits accountId when no organization header is set', async () => {
			clientMock.config.headers = {}

			const listItems = await listAppsForArgs({})

			expect(await listItems()).toBe(appList)

			expect(apiAppsListMock).toHaveBeenCalledTimes(1)
			expect(apiAppsListMock).toHaveBeenCalledWith({})
		})

		describe('with --all-organizations', () => {
			const orgClient = {
				smartapps: { list: apiAppsListMock },
			} as unknown as SmartThingsClient
			const organization = { organizationId: 'org-id', name: 'Org' } as OrganizationResponse

			beforeEach(() => {
				forAllOrganizationsMock.mockImplementationOnce(async (_client, query) => {
					const items = await query(orgClient, organization)
					return items.map(item => ({ ...item, organization: organization.name }))
				})
			})

			it('lists apps from each organization and adds an organization column', async () => {
				const listItems = await listAppsForArgs({ allOrganizations: true, type: appType })

				expect(await listItems()).toStrictEqual([{ appId: 'paged-app-id', organization: 'Org' }])

				expect(forAllOrganizationsMock).toHaveBeenCalledExactlyOnceWith(clientMock, expect.any(Function))
				expect(apiAppsListMock).toHaveBeenCalledExactlyOnceWith({ appType, accountId: 'org-id' })
				expect(outputItemOrListMock).toHaveBeenCalledWith(
					command,
					expect.objectContaining({
						listTableFieldDefinitions: expect.arrayContaining(['organization']),
					}),
					undefined,
					expect.any(Function),
					expect.any(Function),
				)
			})

			it('uses the organization client for verbose listing', async () => {
				verboseSmartAppsMock.mockResolvedValueOnce([{ appId: 'verbose-app-id' }] as SmartAppResponse[])

				const listItems = await listAppsForArgs({ allOrganizations: true, verbose: true })

				expect(await listItems()).toStrictEqual([{ appId: 'verbose-app-id', organization: 'Org' }])

				expect(apiAppsListMock).not.toHaveBeenCalled()
				expect(verboseSmartAppsMock).toHaveBeenCalledExactlyOnceWith(orgClient, { accountId: 'org-id' })
			})
		})
	})

	it('includes URLs and ARNs in output when verbose flag is used', async () => {
		const listItems = await listAppsForArgs({ verbose: true })

		expect(outputItemOrListMock).toHaveBeenCalledWith(
			command,
			expect.objectContaining({
				listTableFieldDefinitions: expect.arrayContaining([{
					label: 'Target URL or ARN', value: shortARNorURLMock,
				}]),
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		const verboseAppList = [{ appId: 'verbose-app-id' }] as SmartAppResponse[]
		verboseSmartAppsMock.mockResolvedValue(verboseAppList)

		expect(await listItems()).toBe(verboseAppList)

		expect(apiAppsListMock).toHaveBeenCalledTimes(0)
		expect(verboseSmartAppsMock).toHaveBeenCalledTimes(1)
		expect(verboseSmartAppsMock).toHaveBeenCalledWith(clientMock, {})
	})
})
