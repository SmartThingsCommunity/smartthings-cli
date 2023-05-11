import { Config } from '@oclif/core'

import { AppResponse, AppsEndpoint, AppType, PagedApp, SmartThingsClient } from '@smartthings/core-sdk'

import {
	APICommand, ChooseOptions, chooseOptionsDefaults, chooseOptionsWithDefaults,
	selectFromList, stringTranslateToId, Table,
} from '@smartthings/cli-lib'

import { buildTableOutput, chooseApp, shortARNorURL, verboseApps } from '../../../lib/commands/apps-util'


describe('chooseApp', () => {
	const appId = 'appId'
	const stringIndex = 'stringIndex'
	const listSpy = jest.spyOn(AppsEndpoint.prototype, 'list').mockResolvedValue([])
	const mockStringTranslateToId = jest.mocked(stringTranslateToId)
	const mockSelectFromList = jest.mocked(selectFromList)
	const mockChooseOptionsWithDefaults = jest.mocked(chooseOptionsWithDefaults)

	class MockCommand extends APICommand<typeof MockCommand.flags> {
		async run(): Promise<void> {
			// eslint-disable-line @typescript-eslint/no-empty-function
		}
	}

	const command = new MockCommand([], new Config({ root: '' }))

	it('sets defaults for passed options', async () => {
		const opts: Partial<ChooseOptions<PagedApp>> = {}
		await chooseApp(command, undefined, opts)

		expect(chooseOptionsWithDefaults).toBeCalledWith(opts)
	})

	it('resolves id from index when allowed', async () => {
		const opts: ChooseOptions<PagedApp> = {
			...chooseOptionsDefaults(),
			allowIndex: true,
		}
		mockChooseOptionsWithDefaults.mockReturnValueOnce(opts)
		mockStringTranslateToId.mockResolvedValueOnce(appId)

		const expectedConfig = {
			itemName: 'app',
			primaryKeyName: 'appId',
			sortKeyName: 'displayName',
		}

		await chooseApp(command, stringIndex, opts)

		expect(stringTranslateToId).toBeCalledWith(
			expect.objectContaining(expectedConfig),
			stringIndex,
			expect.any(Function),
		)

		expect(selectFromList).toBeCalledWith(
			command,
			expect.objectContaining(expectedConfig),
			expect.objectContaining({ preselectedId: appId }),
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

		await chooseApp(command, appId, opts)

		expect(stringTranslateToId).not.toBeCalled()
		expect(selectFromList).toBeCalledWith(
			command,
			expect.objectContaining(expectedConfig),
			expect.objectContaining({ preselectedId: appId }),
		)
	})

	it('uses same list function for index resolution and app selection', async () => {
		const opts: ChooseOptions<PagedApp> = {
			...chooseOptionsDefaults(),
			allowIndex: true,
		}
		mockChooseOptionsWithDefaults.mockReturnValueOnce(opts)
		mockStringTranslateToId.mockResolvedValueOnce(appId)

		await chooseApp(command, stringIndex, opts)

		expect(stringTranslateToId).toBeCalledTimes(1)
		expect(selectFromList).toBeCalledTimes(1)

		const translateList = mockStringTranslateToId.mock.calls[0][2]
		const selectList = mockSelectFromList.mock.calls[0][2].listItems

		expect(translateList).toBe(selectList)
	})

	it('uses correct endpoint to list apps', async () => {
		mockSelectFromList.mockImplementationOnce(async (_command, _config, options) => {
			await options.listItems()
			return appId
		})

		await chooseApp(command, appId)

		expect(listSpy).toBeCalled()
	})
})

describe('buildTableOutput', () => {
	const mockNewOutputTable = jest.fn()
	const mockTableGenerator = {
		newOutputTable: mockNewOutputTable,
		buildTableFromItem: jest.fn(),
		buildTableFromList: jest.fn(),
	}
	it('returns simple string when app settings are not present', () => {
		expect(buildTableOutput(mockTableGenerator, { settings: {} })).toBe('No application settings.')
	})

	it('creates new table with correct options and adds settings', () => {
		const pushMock = jest.fn()
		const toStringMock = jest.fn().mockReturnValue('table output')
		const newTable = { push: pushMock, toString: toStringMock } as Table
		mockNewOutputTable.mockReturnValueOnce(newTable)

		expect(buildTableOutput(mockTableGenerator, { settings: { setting: 'setting value' } })).toEqual('table output')
		expect(mockNewOutputTable).toBeCalledWith(
			expect.objectContaining({ head: ['Key', 'Value'] }),
		)
		expect(pushMock).toHaveBeenCalledTimes(1)
		expect(pushMock).toHaveBeenCalledWith(['setting', 'setting value'])
		expect(toStringMock).toHaveBeenCalledTimes(1)
		expect(toStringMock).toHaveBeenCalledWith()
	})
})

describe('verboseApps', () => {
	const listMock = jest.fn()
	const getMock = jest.fn()
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
