import { CustomCommonOutputProducer, defaultTableGenerator, outputItem } from '@smartthings/cli-lib'
import { AppsEndpoint, AppSettingsResponse } from '@smartthings/core-sdk'
import AppSettingsCommand from '../../../commands/apps/settings.js'
import { buildTableOutput, chooseApp } from '../../../lib/commands/apps-util.js'


jest.mock('../../../lib/commands/apps-util')

describe('AppSettingsCommand', () => {
	const appId = 'appId'
	const mockChooseApp = jest.mocked(chooseApp)
	const mockOutputItem = jest.mocked(outputItem)
	const settingsSpy = jest.spyOn(AppsEndpoint.prototype, 'getSettings').mockImplementation()
	const appSettings: AppSettingsResponse = {
		settings: {},
	}

	beforeAll(() => {
		mockChooseApp.mockResolvedValue(appId)
		mockOutputItem.mockResolvedValue(appSettings)
	})

	it('prompts user to choose app allowing index', async () => {
		await expect(AppSettingsCommand.run([])).resolves.not.toThrow()

		expect(chooseApp).toBeCalledWith(
			expect.any(AppSettingsCommand),
			undefined,
			expect.objectContaining({ allowIndex: true }),
		)
	})

	it('calls outputItem with correct config', async () => {
		mockOutputItem.mockImplementationOnce(async (_command, config) => {
			(config as CustomCommonOutputProducer<AppSettingsResponse>).buildTableOutput(appSettings)
			return appSettings
		})

		await expect(AppSettingsCommand.run([])).resolves.not.toThrow()

		expect(outputItem).toBeCalledWith(
			expect.any(AppSettingsCommand),
			expect.objectContaining({
				buildTableOutput: expect.any(Function),
			}),
			expect.any(Function),
		)

		expect(buildTableOutput).toBeCalledWith(
			expect.any(defaultTableGenerator),
			appSettings,
		)
	})

	it('calls correct endpoint to get app settings', async () => {
		mockOutputItem.mockImplementationOnce(async (_command, _config, getFunction) => {
			return getFunction()
		})

		await expect(AppSettingsCommand.run([])).resolves.not.toThrow()

		expect(settingsSpy).toBeCalledWith(appId)
	})
})
