import { outputItem } from '@smartthings/cli-lib'
import { AppOAuthResponse, AppsEndpoint } from '@smartthings/core-sdk'
import AppOauthCommand from '../../../commands/apps/oauth'
import { chooseApp } from '../../../lib/commands/apps/apps-util'


jest.mock('../../../lib/commands/apps/apps-util')

describe('AppOauthCommand', () => {
	const mockOutputItem = jest.mocked(outputItem)
	const mockChooseApp = jest.mocked(chooseApp)
	const getOauthSpy = jest.spyOn(AppsEndpoint.prototype, 'getOauth').mockImplementation()

	beforeAll(() => {
		mockOutputItem.mockImplementation()
	})

	it('prompts user to choose app allowing index', async () => {
		await expect(AppOauthCommand.run([])).resolves.not.toThrow()

		expect(mockChooseApp).toBeCalledWith(
			expect.any(AppOauthCommand),
			undefined,
			expect.objectContaining({ allowIndex: true }),
		)
	})

	it('calls outputItem with correct config', async () => {
		await expect(AppOauthCommand.run([])).resolves.not.toThrow()

		expect(mockOutputItem).toBeCalledWith(
			expect.any(AppOauthCommand),
			expect.objectContaining({
				tableFieldDefinitions: expect.anything(),
			}),
			expect.any(Function),
		)
	})

	it('uses correct endpoint to get oauth details', async () => {
		const appId = 'appId'
		mockChooseApp.mockResolvedValueOnce(appId)
		const appOAuth = { clientName: 'test' } as AppOAuthResponse
		getOauthSpy.mockResolvedValueOnce(appOAuth)
		mockOutputItem.mockImplementationOnce(async (_command, _config, actionFunction) => {
			return actionFunction()
		})

		await expect(AppOauthCommand.run([appId])).resolves.not.toThrow()
		expect(mockChooseApp).toBeCalledWith(
			expect.anything(),
			appId,
			expect.anything(),
		)
		expect(getOauthSpy).toBeCalledWith(appId)
	})
})
