import { inputAndOutputItem } from '@smartthings/cli-lib'
import { AppsEndpoint, AppSettingsRequest } from '@smartthings/core-sdk'
import AppSettingsUpdateCommand from '../../../../commands/apps/settings/update'
import { chooseApp } from '../../../../lib/commands/apps-util'


jest.mock('../../../../lib/commands/apps-util')

describe('AppSettingsUpdateCommand', () => {
	const mockInputAndOutputItem = jest.mocked(inputAndOutputItem)
	const mockChooseApp = jest.mocked(chooseApp)
	const updateSettingsSpy = jest.spyOn(AppsEndpoint.prototype, 'updateSettings').mockImplementation()

	beforeAll(() => {
		mockInputAndOutputItem.mockImplementation()
	})

	it('prompts user to choose app', async () => {
		await expect(AppSettingsUpdateCommand.run([])).resolves.not.toThrow()

		expect(mockChooseApp).toBeCalledWith(expect.any(AppSettingsUpdateCommand), undefined)
	})

	it('uses correct endpoint to update settings', async () => {
		const appId = 'appId'
		const settings: AppSettingsRequest = {}
		mockChooseApp.mockResolvedValueOnce(appId)
		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, settings)
		})

		await expect(AppSettingsUpdateCommand.run([appId])).resolves.not.toThrow()

		expect(updateSettingsSpy).toBeCalledWith(appId, settings)
	})
})
