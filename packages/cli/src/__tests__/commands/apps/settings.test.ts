import { APICommand, ChooseOptions, CustomCommonOutputProducer, DefaultTableGenerator, GetDataFunction, outputItem, SmartThingsCommandInterface } from '@smartthings/cli-lib'
import { AppsEndpoint, AppSettings } from '@smartthings/core-sdk'
import AppSettingsCommand from '../../../commands/apps/settings'
import { v4 as uuid } from 'uuid'
import { buildTableOutput, chooseApp } from '../../../lib/commands/apps/apps-util'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		outputItem: jest.fn(),
	}
})

jest.mock('../../../lib/commands/apps/apps-util')

describe('AppSettingsCommand', () => {
	const mockChooseApp = chooseApp as
		jest.Mock<Promise<string>, [APICommand, string | undefined, Partial<ChooseOptions> | undefined]>
	const mockOutputItem = outputItem as unknown as
		jest.Mock<Promise<AppSettings>, [
			SmartThingsCommandInterface,
			CustomCommonOutputProducer<AppSettings>,
			GetDataFunction<AppSettings>
		]>
	const settingsSpy = jest.spyOn(AppsEndpoint.prototype, 'getSettings').mockImplementation()
	const appSettings: AppSettings = {}

	beforeAll(() => {
		mockChooseApp.mockResolvedValue(uuid())
		mockOutputItem.mockResolvedValue(appSettings)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('prompts user to choose app allowing index', async () => {
		await expect(AppSettingsCommand.run()).resolves.not.toThrow()

		expect(chooseApp).toBeCalledWith(
			expect.any(AppSettingsCommand),
			undefined,
			expect.objectContaining({ allowIndex: true }),
		)
	})

	it('calls outputItem with correct config', async () => {
		mockOutputItem.mockImplementationOnce(async (_command, config) => {
			config.buildTableOutput(appSettings)
			return appSettings
		})

		await expect(AppSettingsCommand.run()).resolves.not.toThrow()

		expect(outputItem).toBeCalledWith(
			expect.any(AppSettingsCommand),
			expect.objectContaining({
				buildTableOutput: expect.any(Function),
			}),
			expect.any(Function),
		)

		expect(buildTableOutput).toBeCalledWith(
			expect.any(DefaultTableGenerator),
			appSettings,
		)
	})

	it('calls correct endpoint to get app settings', async () => {
		const appId = uuid()
		mockOutputItem.mockImplementationOnce(async (_command, _config, getFunction) => {
			return getFunction()
		})
		mockChooseApp.mockResolvedValueOnce(appId)

		await expect(AppSettingsCommand.run()).resolves.not.toThrow()

		expect(settingsSpy).toBeCalledWith(appId)
	})
})
