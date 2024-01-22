import { jest } from '@jest/globals'

import { AppResponse, AppsEndpoint, AppType, PagedApp, SmartThingsClient } from '@smartthings/core-sdk'

import { PropertyTableFieldDefinition, Table, TableGenerator, ValueTableFieldDefinition } from '../../../../lib/table-generator.js'
import { APICommand } from '../../../../lib/command/api-command.js'
import {
	ChooseOptions,
	chooseOptionsDefaults,
	chooseOptionsWithDefaults,
	stringTranslateToId,
} from '../../../../lib/command/command-util.js'
import { selectFromList, SelectFromListFlags } from '../../../../lib/command/select.js'
import { ListDataFunction } from '../../../../lib/command/basic-io.js'


const chooseOptionsWithDefaultsMock: jest.Mock<typeof chooseOptionsWithDefaults> = jest.fn()
const stringTranslateToIdMock: jest.Mock<typeof stringTranslateToId> = jest.fn()
jest.unstable_mockModule('../../../../lib/command/command-util.js', () => ({
	chooseOptionsDefaults,
	chooseOptionsWithDefaults: chooseOptionsWithDefaultsMock,
	stringTranslateToId: stringTranslateToIdMock,
}))

const selectFromListMock: jest.Mock<typeof selectFromList> = jest.fn()
jest.unstable_mockModule('../../../../lib/command/select.js', () => ({
	selectFromList: selectFromListMock,
}))


const {
	buildTableOutput,
	chooseApp,
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

describe('chooseApp', () => {
	stringTranslateToIdMock.mockResolvedValue('translated-app-id')
	selectFromListMock.mockResolvedValue('selected-app-id')
	chooseOptionsWithDefaultsMock.mockReturnValue(chooseOptionsDefaults())

	const apiAppsListMock: jest.Mock<typeof AppsEndpoint.prototype.list> = jest.fn()
	const command = {
		client: {
			apps: {
				list: apiAppsListMock,
			},
		},
	} as unknown as APICommand<SelectFromListFlags>

	it('sets defaults for passed options', async () => {
		const listItemsMock: jest.Mock<ListDataFunction<PagedApp>> = jest.fn()
		const opts: Partial<ChooseOptions<PagedApp>> = { listItems: listItemsMock }

		expect(await chooseApp(command, undefined, opts)).toBe('selected-app-id')

		expect(listItemsMock).toHaveBeenCalledTimes(0)
		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledTimes(1)
		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledWith(opts)
	})

	it('resolves id from index when allowed', async () => {
		const opts: ChooseOptions<PagedApp> = {
			...chooseOptionsDefaults(),
			allowIndex: true,
		}
		chooseOptionsWithDefaultsMock.mockReturnValueOnce(opts)

		const expectedConfig = {
			itemName: 'app',
			primaryKeyName: 'appId',
			sortKeyName: 'displayName',
		}

		expect(await chooseApp(command, 'app-from-arg', opts)).toBe('selected-app-id')

		expect(stringTranslateToIdMock).toHaveBeenCalledTimes(1)
		expect(stringTranslateToIdMock).toHaveBeenCalledWith(
			expect.objectContaining(expectedConfig),
			'app-from-arg',
			expect.any(Function),
		)

		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(
			command,
			expect.objectContaining(expectedConfig),
			expect.objectContaining({ preselectedId: 'translated-app-id' }),
		)
	})

	it('uses app id arg when index not allowed', async () => {
		const opts: Partial<ChooseOptions<PagedApp>> = {
			allowIndex: false,
		}
		const expectedConfig = {
			itemName: 'app',
			primaryKeyName: 'appId',
			sortKeyName: 'displayName',
		}

		expect(await chooseApp(command, 'app-from-arg', opts)).toBe('selected-app-id')

		expect(stringTranslateToIdMock).toHaveBeenCalledTimes(0)
		expect(selectFromListMock).toHaveBeenCalledWith(
			command,
			expect.objectContaining(expectedConfig),
			expect.objectContaining({ preselectedId: 'app-from-arg' }),
		)
	})

	it('uses same list function for index resolution and app selection', async () => {
		const opts: ChooseOptions<PagedApp> = {
			...chooseOptionsDefaults(),
			allowIndex: true,
		}
		chooseOptionsWithDefaultsMock.mockReturnValueOnce(opts)

		expect(await chooseApp(command, 'app-from-arg', opts)).toBe('selected-app-id')

		expect(stringTranslateToIdMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledTimes(1)

		const listFromTranslateCall = stringTranslateToIdMock.mock.calls[0][2]
		const listFromSelectCall = selectFromListMock.mock.calls[0][2].listItems

		expect(listFromTranslateCall).toBe(listFromSelectCall)
	})

	it('uses correct endpoint to list apps', async () => {
		expect(await chooseApp(command)).toBe('selected-app-id')

		const listItems = selectFromListMock.mock.calls[0][2].listItems
		const appsList = [{ appId: 'listed-app-id' } as PagedApp]
		apiAppsListMock.mockResolvedValueOnce(appsList)

		expect(await listItems()).toBe(appsList)

		expect(apiAppsListMock).toHaveBeenCalledTimes(1)
		expect(apiAppsListMock).toHaveBeenCalledWith()
	})
})

describe('buildTableOutput', () => {
	const newOutputTableMock: jest.Mock<TableGenerator['newOutputTable']> = jest.fn()
	const mockTableGenerator = {
		newOutputTable: newOutputTableMock,
	} as unknown as TableGenerator
	it('returns simple string when app settings are not present', () => {
		expect(buildTableOutput(mockTableGenerator, { settings: {} })).toBe('No application settings.')
	})

	it('creates new table with correct options and adds settings', () => {
		const pushMock = jest.fn()
		const toStringMock = jest.fn().mockReturnValue('table output')
		const newTable = { push: pushMock, toString: toStringMock } as Table
		newOutputTableMock.mockReturnValueOnce(newTable)

		expect(buildTableOutput(mockTableGenerator, { settings: { setting: 'setting value' } })).toEqual('table output')
		expect(newOutputTableMock).toHaveBeenCalledWith(
			expect.objectContaining({ head: ['Key', 'Value'] }),
		)
		expect(pushMock).toHaveBeenCalledTimes(1)
		expect(pushMock).toHaveBeenCalledWith(['setting', 'setting value'])
		expect(toStringMock).toHaveBeenCalledTimes(1)
		expect(toStringMock).toHaveBeenCalledWith()
	})
})

describe('verboseApps', () => {
	const listMock: jest.Mock<typeof AppsEndpoint.prototype.list> = jest.fn()
	const getMock: jest.Mock<typeof AppsEndpoint.prototype.get> = jest.fn()
	const apps = { list: listMock, get: getMock } as unknown as AppsEndpoint
	const client = { apps } as SmartThingsClient

	it('passes options to list', async () => {
		listMock.mockResolvedValueOnce([])
		const options = { appType: AppType.API_ONLY }

		expect(await verboseApps(client, options))

		expect(listMock).toHaveBeenCalledTimes(1)
		expect(listMock).toHaveBeenCalledWith(options)
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

		expect(listMock).toHaveBeenCalledTimes(1)
		expect(listMock).toHaveBeenCalledWith({})
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
