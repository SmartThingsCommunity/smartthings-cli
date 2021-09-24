import { ActionFunction, APICommand, ChooseOptions, inputAndOutputItem, SmartThingsCommandInterface, TableCommonOutputProducer } from '@smartthings/cli-lib'
import { App, AppRequest, AppsEndpoint } from '@smartthings/core-sdk'
import { FunctionName, Principal, StatementId } from 'aws-sdk/clients/lambda'
import AppUpdateCommand from '../../../commands/apps/update'
import { chooseApp, tableFieldDefinitions } from '../../../lib/commands/apps/apps-util'
import { addPermission } from '../../../lib/aws-utils'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		inputAndOutputItem: jest.fn(),
	}
})

jest.mock('../../../lib/aws-utils')

jest.mock('../../../lib/commands/apps/apps-util')

describe('AppUpdateCommand', () => {
	const appId = 'appId'
	const mockInputOutput = inputAndOutputItem as unknown as
		jest.Mock<Promise<void>, [
			SmartThingsCommandInterface,
			TableCommonOutputProducer<App>,
			ActionFunction<void, AppRequest, App>
		]>
	const mockAddPermission = addPermission as
		jest.Mock<Promise<string>, [
			FunctionName,
			Principal,
			StatementId
		]>
	const mockChooseApp = chooseApp as
		jest.Mock<Promise<string>, [APICommand, string | undefined, Partial<ChooseOptions> | undefined]>
	const updateSpy = jest.spyOn(AppsEndpoint.prototype, 'update').mockImplementation()

	beforeAll(() => {
		mockChooseApp.mockResolvedValue(appId)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('prompts user to choose app', async () => {
		await expect(AppUpdateCommand.run()).resolves.not.toThrow()

		expect(chooseApp).toBeCalledWith(
			expect.any(AppUpdateCommand),
			undefined,
		)
	})

	it('calls inputOutput with correct config', async () => {
		await expect(AppUpdateCommand.run()).resolves.not.toThrow()

		expect(mockInputOutput).toBeCalledWith(
			expect.any(AppUpdateCommand),
			expect.objectContaining({
				tableFieldDefinitions,
			}),
			expect.any(Function),
		)
	})

	it('calls correct update endpoint', async () => {
		const appRequest: AppRequest = {}
		mockInputOutput.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, appRequest)
		})
		mockChooseApp.mockResolvedValueOnce(appId)

		await expect(AppUpdateCommand.run([appId])).resolves.not.toThrow()

		expect(updateSpy).toBeCalledWith(appId, appRequest)
	})

	it('accepts authorize flag for lambda apps', async () => {
		const arn = 'arn'
		const anotherArn = 'anotherArn'
		const appRequest: AppRequest = {
			lambdaSmartApp: {
				functions: [arn, anotherArn],
			},
		}
		mockInputOutput.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, appRequest)
		})
		mockChooseApp.mockResolvedValueOnce(appId)

		await expect(AppUpdateCommand.run([appId, '--authorize'])).resolves.not.toThrow()

		expect(addPermission).toBeCalledTimes(2)
		expect(addPermission).toBeCalledWith(arn, undefined, undefined)
		expect(addPermission).toBeCalledWith(anotherArn, undefined, undefined)
		expect(updateSpy).toBeCalledWith(appId, appRequest)
	})

	it('throws error if authorize flag is used on non-lambda app', async () => {
		const appRequest: AppRequest = {
			webhookSmartApp: {},
		}
		mockInputOutput.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, appRequest)
		})

		await expect(AppUpdateCommand.run(['--authorize'])).rejects.toThrow('Authorization is not applicable to WebHook SmartApps')
		expect(updateSpy).not.toBeCalled()
	})

	it('ignores authorize flag for lambda apps with no functions', async () => {
		let appRequest: AppRequest = {
			lambdaSmartApp: {
				functions: [],
			},
		}
		mockInputOutput.mockImplementation(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, appRequest)
		})
		mockChooseApp.mockResolvedValue(appId)

		await expect(AppUpdateCommand.run([appId, '--authorize'])).resolves.not.toThrow()

		expect(addPermission).not.toBeCalled()
		expect(updateSpy).toBeCalledWith(appId, appRequest)

		updateSpy.mockClear()

		appRequest = {
			lambdaSmartApp: {},
		}

		await expect(AppUpdateCommand.run([appId, '--authorize'])).resolves.not.toThrow()

		expect(addPermission).not.toBeCalled()
		expect(updateSpy).toBeCalledWith(appId, appRequest)
	})

	it('calls addPermission with principal flag', async () => {
		const arn = 'arn'
		const appRequest: AppRequest = {
			lambdaSmartApp: {
				functions: [arn],
			},
		}
		mockInputOutput.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, appRequest)
		})

		const principal = 'principal'
		await expect(AppUpdateCommand.run(['--authorize', `--principal=${principal}`])).resolves.not.toThrow()

		expect(addPermission).toBeCalledWith(arn, principal, undefined)
	})

	it('calls addPermission with statement-id flag', async () => {
		const arn = 'arn'
		const appRequest: AppRequest = {
			lambdaSmartApp: {
				functions: [arn],
			},
		}
		mockInputOutput.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, appRequest)
		})

		const statementId = 'statementId'
		await expect(AppUpdateCommand.run(['--authorize', `--statement-id=${statementId}`])).resolves.not.toThrow()

		expect(addPermission).toBeCalledWith(arn, undefined, statementId)
	})

	it('ignores already authorized functions', async () => {
		const arn = 'arn'
		const appRequest: AppRequest = {
			lambdaSmartApp: {
				functions: [arn],
			},
		}
		mockInputOutput.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, appRequest)
		})

		mockAddPermission.mockResolvedValueOnce('Already authorized')

		await expect(AppUpdateCommand.run(['--authorize'])).resolves.not.toThrow()

		expect(addPermission).toBeCalledWith(arn, undefined, undefined)
	})
})
