import { inputAndOutputItem } from '@smartthings/cli-lib'
import { AppsEndpoint, AppSettings } from '@smartthings/core-sdk'
import { v4 as uuid } from 'uuid'
import AppSettingsUpdateCommand from '../../../../commands/apps/settings/update'
import { chooseApp } from '../../../../lib/commands/apps/apps-util'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		inputAndOutputItem: jest.fn(),
	}
})

jest.mock('../../../../lib/commands/apps/apps-util')

describe('AppSettingsUpdateCommand', () => {
	const mockInputOutput = inputAndOutputItem as unknown as jest.Mock
	const mockChooseApp = chooseApp as jest.Mock
	const updateSettingsSpy = jest.spyOn(AppsEndpoint.prototype, 'updateSettings').mockImplementation()

	beforeAll(() => {
		mockInputOutput.mockImplementation()
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('prompts user to choose app', async () => {
		await expect(AppSettingsUpdateCommand.run([])).resolves.not.toThrow()

		expect(mockChooseApp).toBeCalledWith(expect.any(AppSettingsUpdateCommand), undefined)
	})

	it('uses correct endpoint to update settings', async () => {
		const appId = uuid()
		const settings: AppSettings = {}
		mockChooseApp.mockResolvedValueOnce(appId)
		mockInputOutput.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(appId, settings)
		})

		await expect(AppSettingsUpdateCommand.run([appId])).resolves.not.toThrow()

		expect(updateSettingsSpy).toBeCalledWith(appId, settings)
	})
})
