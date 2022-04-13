import { inputAndOutputItem } from '@smartthings/cli-lib'
import { AppOAuth, AppsEndpoint } from '@smartthings/core-sdk'
import AppOauthUpdateCommand from '../../../../commands/apps/oauth/update'
import { chooseApp } from '../../../../lib/commands/apps/apps-util'


jest.mock('../../../../lib/commands/apps/apps-util')

describe('AppOauthUpdateCommand', () => {
	const mockInputAndOutputItem = jest.mocked(inputAndOutputItem)
	const mockChooseApp = jest.mocked(chooseApp)
	const updateOauthSpy = jest.spyOn(AppsEndpoint.prototype, 'updateOauth').mockImplementation()

	beforeAll(() => {
		mockInputAndOutputItem.mockImplementation()
	})

	it('prompts user to choose app', async () => {
		await expect(AppOauthUpdateCommand.run([])).resolves.not.toThrow()

		expect(mockChooseApp).toBeCalledWith(expect.any(AppOauthUpdateCommand), undefined)
	})

	it('uses correct endpoint to update oauth', async () => {
		const appId = 'appId'
		const oAuth: AppOAuth = { clientName: 'test' }
		mockChooseApp.mockResolvedValueOnce(appId)
		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, oAuth)
		})

		await expect(AppOauthUpdateCommand.run([appId])).resolves.not.toThrow()

		expect(updateOauthSpy).toBeCalledWith(appId, oAuth)
	})
})
