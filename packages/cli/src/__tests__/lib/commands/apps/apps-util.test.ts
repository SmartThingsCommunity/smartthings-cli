import { Config } from '@oclif/core'

import { AppsEndpoint } from '@smartthings/core-sdk'

import {
	APICommand, ChooseOptions, chooseOptionsDefaults, chooseOptionsWithDefaults,
	selectFromList, stringTranslateToId,
} from '@smartthings/cli-lib'

import { buildTableOutput, chooseApp } from '../../../../lib/commands/apps/apps-util'
import Table from 'cli-table'


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
		const opts: Partial<ChooseOptions> = {}
		await chooseApp(command, undefined, opts)

		expect(chooseOptionsWithDefaults).toBeCalledWith(opts)
	})

	it('resolves id from index when allowed', async () => {
		const opts: ChooseOptions = {
			...chooseOptionsDefaults,
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
		const opts: Partial<ChooseOptions> = {
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
		const opts: ChooseOptions = {
			...chooseOptionsDefaults,
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
		expect(buildTableOutput(mockTableGenerator, {})).toBe('No application settings.')
		expect(buildTableOutput(mockTableGenerator, { settings: {} })).toBe('No application settings.')
	})

	it('creates new table with correct options and adds settings', () => {
		const newTable = new Table()
		mockNewOutputTable.mockReturnValueOnce(newTable)

		expect(buildTableOutput(mockTableGenerator, { settings: { setting: 'setting' } })).toStrictEqual(newTable.toString())
		expect(mockNewOutputTable).toBeCalledWith(
			expect.objectContaining({ head: ['Key', 'Value'] }),
		)
		expect(newTable).toContainValue(['setting', 'setting'])
	})
})
