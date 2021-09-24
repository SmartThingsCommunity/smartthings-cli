import { ListDataFunction, selectFromList, SelectingConfig, SmartThingsCommandInterface } from '@smartthings/cli-lib'
import { App, AppsEndpoint, AppType } from '@smartthings/core-sdk'
import AppRegisterCommand from '../../../commands/apps/register'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		selectFromList: jest.fn(),
	}
})

describe('AppRegisterCommand', () => {
	const appId = 'appId'
	const registerSpy = jest.spyOn(AppsEndpoint.prototype, 'register').mockImplementation(async () => {
		return { status: '200' }
	})
	const listSpy = jest.spyOn(AppsEndpoint.prototype, 'list').mockImplementation()
	const logSpy = jest.spyOn(AppRegisterCommand.prototype, 'log').mockImplementation()
	const mockSelectFromList = selectFromList as
		jest.Mock<Promise<string>, [
			SmartThingsCommandInterface,
			SelectingConfig<App>,
			string | undefined,
			ListDataFunction<App>,
			string | undefined
		]>

	beforeAll(() => {
		mockSelectFromList.mockResolvedValue(appId)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('calls selectFromList with correct config', async () => {
		await expect(AppRegisterCommand.run()).resolves.not.toThrow()

		expect(mockSelectFromList).toBeCalledWith(
			expect.any(AppRegisterCommand),
			expect.objectContaining({
				primaryKeyName: 'appId',
				sortKeyName: 'displayName',
				listTableFieldDefinitions: expect.arrayContaining(['displayName', 'appType', 'appId']),
			}),
			undefined,
			expect.any(Function),
			expect.stringContaining('Select an app to register'),
		)
	})

	it('calls correct endpoint for registration and logs success', async () => {
		mockSelectFromList.mockResolvedValueOnce(appId)

		await expect(AppRegisterCommand.run([appId])).resolves.not.toThrow()

		expect(registerSpy).toBeCalledWith(appId)
		expect(logSpy).toBeCalledWith(expect.stringContaining(`Registration request sent to app ${appId}`))
		expect(logSpy).toBeCalledWith(expect.stringContaining('Check server log for confirmation URL'))
	})

	it('lists all app types that support registration', async () => {
		const webhookApps: App[] = [{ appType: AppType.WEBHOOK_SMART_APP, webhookSmartApp: {} }]
		const apiOnlyApps: App[] = [{ appType: AppType.API_ONLY, apiOnly: {} }]
		listSpy.mockImplementation(async (options) => {
			let apps: App[] = []
			if (options?.appType == AppType.WEBHOOK_SMART_APP) {
				apps = webhookApps
			} else if (options?.appType == AppType.API_ONLY) {
				apps = apiOnlyApps
			}

			return apps
		})

		await expect(AppRegisterCommand.run()).resolves.not.toThrow()

		const listFunction = mockSelectFromList.mock.calls[0][3]
		await expect(listFunction()).resolves.toEqual(webhookApps.concat(apiOnlyApps))
		expect(listSpy).toBeCalledWith(expect.objectContaining({ appType: AppType.WEBHOOK_SMART_APP }))
		expect(listSpy).toBeCalledWith(expect.objectContaining({ appType: AppType.API_ONLY }))
	})
})
