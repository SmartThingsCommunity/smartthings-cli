import { inputAndOutputItem } from '@smartthings/cli-lib'
import { AppOAuth, AppsEndpoint } from '@smartthings/core-sdk'
import { v4 as uuid } from 'uuid'
import AppOauthGenerateCommand from '../../../../commands/apps/oauth/generate'
import { chooseApp } from '../../../../lib/commands/apps/apps-util'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		inputAndOutputItem: jest.fn(),
	}
})

jest.mock('../../../../lib/commands/apps/apps-util')

describe('AppOauthGenerateCommand', () => {
	const mockInputOutput = inputAndOutputItem as unknown as jest.Mock
	const mockChooseApp = chooseApp as jest.Mock
	const regenerateSpy = jest.spyOn(AppsEndpoint.prototype, 'regenerateOauth').mockImplementation()

	beforeAll(() => {
		mockInputOutput.mockImplementation()
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('prompts user to choose app', async () => {
		await expect(AppOauthGenerateCommand.run()).resolves.not.toThrow()

		expect(mockChooseApp).toBeCalledWith(expect.any(AppOauthGenerateCommand), undefined)
	})

	it('calls inputOutput with correct config', async () => {
		await expect(AppOauthGenerateCommand.run()).resolves.not.toThrow()

		expect(mockInputOutput).toBeCalledWith(
			expect.any(AppOauthGenerateCommand),
			expect.objectContaining({
				tableFieldDefinitions: expect.arrayContaining(['oauthClientId', 'oauthClientSecret']),
			}),
			expect.any(Function),
		)
	})

	it('uses correct endpoint to generate oauth', async () => {
		const appId = uuid()
		const oAuth: AppOAuth = { clientName: 'test' }
		mockChooseApp.mockResolvedValueOnce(appId)
		mockInputOutput.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(appId, oAuth)
		})

		await expect(AppOauthGenerateCommand.run([appId])).resolves.not.toThrow()

		expect(regenerateSpy).toBeCalledWith(appId, oAuth)
	})
})
