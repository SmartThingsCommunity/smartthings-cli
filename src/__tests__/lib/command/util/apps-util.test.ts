import { jest } from '@jest/globals'

import {
	type AppResponse,
	type AppsEndpoint,
	AppType,
	type AppUpdateRequest,
	type PagedApp,
	type SmartThingsClient,
} from '@smartthings/core-sdk'

import type { addPermission } from '../../../../lib/aws-util.js'
import type {
	PropertyTableFieldDefinition,
	TableGenerator,
	ValueTableFieldDefinition,
} from '../../../../lib/table-generator.js'
import type { fatalError } from '../../../../lib/util.js'
import type { APICommand } from '../../../../lib/command/api-command.js'
import type { stringTranslateToId } from '../../../../lib/command/command-util.js'
import type {
	createChooseFn,
	ChooseFunction,
} from '../../../../lib/command/util/util-util.js'
import {
	mockedTableOutput,
	tableMock,
	tablePushMock,
	tableToStringMock,
} from '../../../test-lib/table-mock.js'


const addPermissionMock = jest.fn<typeof addPermission>()
jest.unstable_mockModule('../../../../lib/aws-util.js', () => ({
	addPermission: addPermissionMock,
}))

const fatalErrorMock = jest.fn<typeof fatalError>().mockReturnValue('never return' as never)
jest.unstable_mockModule('../../../../lib/util.js', () => ({
	fatalError: fatalErrorMock,
}))

const stringTranslateToIdMock = jest.fn<typeof stringTranslateToId>()
jest.unstable_mockModule('../../../../lib/command/command-util.js', () => ({
	stringTranslateToId: stringTranslateToIdMock,
}))

const createChooseFnMock = jest.fn<typeof createChooseFn<PagedApp>>()
jest.unstable_mockModule('../../../../lib/command/util/util-util.js', () => ({
	createChooseFn: createChooseFnMock,
}))


const {
	authorizeApp,
	buildTableOutput,
	chooseAppFn,
	hasSubscription,
	isWebhookSmartApp,
	shortARNorURL,
	tableFieldDefinitions,
	verboseApps,
} = await import('../../../../lib/command/util/apps-util.js')


test.each`
	input                             | expected
	${{}}                             | ${false}
	${{ webhookSmartApp: undefined }} | ${false}
	${{ webhookSmartApp: {} }}        | ${true}
`('isWebhookSmartApp returns $expected for $input', ({ input, expected }) => {
	expect(isWebhookSmartApp(input)).toBe(expected)
})

test.each`
	input                                       | expected
	${{}}                                       | ${false}
	${{ apiOnly: undefined }}                   | ${false}
	${{ apiOnly: {} }}                          | ${false}
	${{ apiOnly: { subscription: undefined } }} | ${false}
	${{ apiOnly: { subscription: {} } }}        | ${true}
`('certified include returns $expected for $input', ({ input, expected }) => {
	expect(hasSubscription(input)).toBe(expected)
})

describe('tableFieldDefinitions functions', () => {
	test.each`
		input                             | expected
		${{}}                             | ${false}
		${{ classifications: undefined }} | ${false}
		${{ classifications: [] }}        | ${true}
	`('classifications include returns $expected for $input', ({ input, expected }) => {
		const include = (tableFieldDefinitions[5] as PropertyTableFieldDefinition<AppResponse>).include as (input: AppResponse) => boolean
		expect(include(input)).toBe(expected)
	})

	test.each`
		input                                            | expected
		${{}}                                            | ${false}
		${{ installMetadata: undefined }}                | ${false}
		${{ installMetadata: {} }}                       | ${false}
		${{ installMetadata: { certified: undefined } }} | ${false}
		${{ installMetadata: { certified: true } }}      | ${true}
	`('certified include returns $expected for $input', ({ input, expected }) => {
		const include = (tableFieldDefinitions[6] as PropertyTableFieldDefinition<AppResponse>).include as (input: AppResponse) => boolean
		expect(include(input)).toBe(expected)
	})

	test.each`
		input                                              | expected
		${{}}                                              | ${false}
		${{ installMetadata: undefined }}                  | ${false}
		${{ installMetadata: {} }}                         | ${false}
		${{ installMetadata: { maxInstalls: undefined } }} | ${false}
		${{ installMetadata: { maxInstalls: true } }}      | ${true}
	`('maxInstalls include returns $expected for $input', ({ input, expected }) => {
		const include = (tableFieldDefinitions[7] as PropertyTableFieldDefinition<AppResponse>).include as (input: AppResponse) => boolean
		expect(include(input)).toBe(expected)
	})

	test.each`
		input                                            | expected
		${{}}                                            | ${false}
		${{ webhookSmartApp: undefined }}                | ${false}
		${{ webhookSmartApp: {} }}                       | ${false}
		${{ webhookSmartApp: { publicKey: undefined } }} | ${false}
		${{ webhookSmartApp: { publicKey: 'key' } }}     | ${true}
	`('Public Key include returns $expected for $input', ({ input, expected }) => {
		const include = (tableFieldDefinitions[12] as ValueTableFieldDefinition<AppResponse>).include as (input: AppResponse) => boolean
		expect(include(input)).toBe(expected)
	})

	test.each`
		input                                                          | expected
		${{}}                                                          | ${''}
		${{ webhookSmartApp: {} }}                                     | ${''}
		${{ webhookSmartApp: { publicKey: 'key' } }}                   | ${'key'}
		${{ webhookSmartApp: { publicKey: 'key\r\npart2\r\npart3' } }} | ${'key\npart2\npart3'}
	`('Public Key value returns $expected for $input', ({ input, expected }) => {
		const value = (tableFieldDefinitions[12] as ValueTableFieldDefinition<AppResponse>).value as (input: AppResponse) => string
		expect(value(input)).toBe(expected)
	})

	test.each`
		input                                           | expected
		${{}}                                           | ${false}
		${{ lambdaSmartApp: undefined }}                | ${false}
		${{ lambdaSmartApp: {} }}                       | ${false}
		${{ lambdaSmartApp: { functions: undefined } }} | ${false}
		${{ lambdaSmartApp: { functions: [] } }}        | ${true}
	`('Lambda Function include returns $expected for $input', ({ input, expected }) => {
		const include = (tableFieldDefinitions[13] as ValueTableFieldDefinition<AppResponse>).include as (input: AppResponse) => boolean
		expect(include(input)).toBe(expected)
	})

	test.each`
		input                                                  | expected
		${{}}                                                  | ${''}
		${{ lambdaSmartApp: {} }}                              | ${''}
		${{ lambdaSmartApp: { functions: ['fun1'] } }}         | ${'fun1'}
		${{ lambdaSmartApp: { functions: ['fun1', 'fun2'] } }} | ${'fun1\nfun2'}
	`('Lambda Function value returns $expected for $input', ({ input, expected }) => {
		const value = (tableFieldDefinitions[13] as ValueTableFieldDefinition<AppResponse>).value as (input: AppResponse) => string
		expect(value(input)).toBe(expected)
	})
})

test('chooseAppFn uses correct endpoint to list apps', async () => {
	const chooseAppMock = jest.fn<ChooseFunction<PagedApp>>()
	createChooseFnMock.mockReturnValueOnce(chooseAppMock)

	const chooseApp = chooseAppFn()

	expect(chooseApp).toBe(chooseAppMock)

	expect(createChooseFnMock).toHaveBeenCalledExactlyOnceWith(
		expect.objectContaining({ itemName: 'app' }),
		expect.any(Function),
	)

	const appList = [{ appId: 'listed-app-id' } as PagedApp]
	const apiAppsListMock = jest.fn<typeof AppsEndpoint.prototype.list>()
		.mockResolvedValueOnce(appList)
	const listItems = createChooseFnMock.mock.calls[0][1]
	const command = {
		client: {
			apps: {
				list: apiAppsListMock,
			},
		},
	} as unknown as APICommand

	expect(await listItems(command)).toBe(appList)

	expect(apiAppsListMock).toHaveBeenCalledExactlyOnceWith()
})

describe('buildTableOutput', () => {
	const newOutputTableMock = jest.fn<TableGenerator['newOutputTable']>()
	const mockTableGenerator = {
		newOutputTable: newOutputTableMock,
	} as unknown as TableGenerator
	it('returns simple string when app settings are not present', () => {
		expect(buildTableOutput(mockTableGenerator, { settings: {} })).toBe('No application settings.')
	})

	it('creates new table with correct options and adds settings', () => {
		newOutputTableMock.mockReturnValueOnce(tableMock)

		expect(buildTableOutput(mockTableGenerator, { settings: { setting: 'setting value' } }))
			.toBe(mockedTableOutput)
		expect(newOutputTableMock).toHaveBeenCalledWith(
			expect.objectContaining({ head: ['Key', 'Value'] }),
		)
		expect(tablePushMock).toHaveBeenCalledExactlyOnceWith(['setting', 'setting value'])
		expect(tableToStringMock).toHaveBeenCalledExactlyOnceWith()
	})
})

describe('verboseApps', () => {
	const listMock = jest.fn<typeof AppsEndpoint.prototype.list>()
	const getMock = jest.fn<typeof AppsEndpoint.prototype.get>()
	const apps = { list: listMock, get: getMock } as unknown as AppsEndpoint
	const client = { apps } as SmartThingsClient

	it('passes options to list', async () => {
		listMock.mockResolvedValueOnce([])
		const options = { appType: AppType.API_ONLY }

		expect(await verboseApps(client, options))

		expect(listMock).toHaveBeenCalledExactlyOnceWith(options)
		expect(getMock).toHaveBeenCalledTimes(0)
	})

	it('uses get for every item in list', async () => {
		const pagedApp1 = { appId: 'paged-app-1-id' } as PagedApp
		const pagedApp2 = { appId: 'paged-app-2-id' } as PagedApp
		const verboseApp1 = { appId: 'verbose-app-1-id' } as AppResponse
		const verboseApp2 = { appId: 'verbose-app-2-id' } as AppResponse

		listMock.mockResolvedValueOnce([pagedApp1, pagedApp2])
		getMock.mockResolvedValueOnce(verboseApp1)
		getMock.mockResolvedValueOnce(verboseApp2)

		expect(await verboseApps(client, {}))

		expect(listMock).toHaveBeenCalledExactlyOnceWith({})
		expect(getMock).toHaveBeenCalledTimes(2)
		expect(getMock).toHaveBeenCalledWith('paged-app-1-id')
		expect(getMock).toHaveBeenCalledWith('paged-app-2-id')
	})
})

describe('shortARNorURL', () => {
	it('uses webhookSmartApp targetUrl', () => {
		const targetUrl = 'webhook target URL'
		expect(shortARNorURL({ webhookSmartApp: { targetUrl } } as unknown as PagedApp)).toBe(targetUrl)
	})

	it('uses first lambdaSmartApp function', () => {
		expect(shortARNorURL({ lambdaSmartApp: { functions: ['function 1'] } } as unknown as PagedApp))
			.toBe('function 1')
	})

	it('uses empty string for lambdaSmartApp empty function list', () => {
		expect(shortARNorURL({ lambdaSmartApp: {} } as unknown as PagedApp)).toBe('')
		expect(shortARNorURL({ lambdaSmartApp: { functions: [] } } as unknown as PagedApp)).toBe('')
	})

	it('uses apiOnly subscription targetUrl', () => {
		const targetUrl = 'apiOnly subscription URL'
		expect(shortARNorURL({ apiOnly: { subscription: { targetUrl } } } as unknown as PagedApp)).toBe(targetUrl)
		expect(shortARNorURL({ apiOnly: {} } as unknown as PagedApp)).toBe('')
		expect(shortARNorURL({ apiOnly: { subscription: {} } } as unknown as PagedApp)).toBe('')
	})

	it('falls back on an empty string', () => {
		expect(shortARNorURL({} as unknown as PagedApp)).toBe('')
	})

	it.each([
		'short URL',
		'12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345',
	])('includes full URL for short URLs', (targetUrl) => {
		expect(shortARNorURL({ webhookSmartApp: { targetUrl } } as unknown as PagedApp)).toBe(targetUrl)
	})

	it('trims long URLs', () => {
		const targetUrl = '123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456'
		const trimmed = '12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345...'
		expect(shortARNorURL({ webhookSmartApp: { targetUrl } } as unknown as PagedApp)).toBe(trimmed)
	})
})

describe('authorizeApp', () => {
	it('errors for non-lambda apps', async () => {
		expect(await authorizeApp({} as AppUpdateRequest, 'principal', 'statement')).toBe('never return')

		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith(
			'Authorization is only applicable to Lambda SmartApps.',
		)
	})

	it('does nothing given no functions', async () => {
		await authorizeApp({ lambdaSmartApp: {} } as AppUpdateRequest, 'principal', 'statement')

		expect(addPermissionMock).not.toHaveBeenCalled()
		expect(fatalErrorMock).not.toHaveBeenCalled()
	})

	it('calls addPermission for all functions', async () => {
		await authorizeApp({ lambdaSmartApp: {
			functions: ['function-arn-1', 'function-arn-2'],
		} } as AppUpdateRequest, 'principal', 'statement')

		expect(addPermissionMock).toHaveBeenCalledTimes(2)
		expect(addPermissionMock).toHaveBeenCalledWith('function-arn-1', 'principal', 'statement')
		expect(addPermissionMock).toHaveBeenCalledWith('function-arn-2', 'principal', 'statement')

		expect(fatalErrorMock).not.toHaveBeenCalled()
	})
})
