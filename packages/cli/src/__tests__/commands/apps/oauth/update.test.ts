import { inputAndOutputItem } from '@smartthings/cli-lib'
import { AppOAuth, AppsEndpoint } from '@smartthings/core-sdk'
import { v4 as uuid } from 'uuid'
import AppOauthUpdateCommand from '../../../../commands/apps/oauth/update'
import { chooseApp } from '../../../../lib/commands/apps/apps-util'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		inputAndOutputItem: jest.fn(),
	}
})

jest.mock('../../../../lib/commands/apps/apps-util')

describe('AppOauthUpdateCommand', () => {
	const mockInputOutput = inputAndOutputItem as unknown as jest.Mock
	const mockChooseApp = chooseApp as jest.Mock
	const updateOauthSpy = jest.spyOn(AppsEndpoint.prototype, 'updateOauth').mockImplementation()

	beforeAll(() => {
		mockInputOutput.mockImplementation()
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('prompts user to choose app', async () => {
		await expect(AppOauthUpdateCommand.run([])).resolves.not.toThrow()

		expect(mockChooseApp).toBeCalledWith(expect.any(AppOauthUpdateCommand), undefined)
	})

	it('uses correct endpoint to update oauth', async () => {
		const appId = uuid()
		const oAuth: AppOAuth = { clientName: 'test' }
		mockChooseApp.mockResolvedValueOnce(appId)
		mockInputOutput.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(appId, oAuth)
		})

		await expect(AppOauthUpdateCommand.run([appId])).resolves.not.toThrow()

		expect(updateOauthSpy).toBeCalledWith(appId, oAuth)
	})
})
