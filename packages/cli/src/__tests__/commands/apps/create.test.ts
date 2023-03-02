import { CustomCommonOutputProducer, DefaultTableGenerator, inputAndOutputItem, IOFormat } from '@smartthings/cli-lib'
import { AppCreationResponse, AppCreateRequest, AppsEndpoint, AppResponse } from '@smartthings/core-sdk'
import AppCreateCommand from '../../../commands/apps/create'
import { tableFieldDefinitions } from '../../../lib/commands/apps-util'
import { addPermission } from '../../../lib/aws-utils'


jest.mock('../../../lib/aws-utils')

describe('AppCreateCommand', () => {
	const mockInputAndOutputItem = jest.mocked(inputAndOutputItem)
	const mockAddPermission = jest.mocked(addPermission)
	const createSpy = jest.spyOn(AppsEndpoint.prototype, 'create').mockImplementation()
	const logSpy = jest.spyOn(AppCreateCommand.prototype, 'log').mockImplementation()

	it('calls inputOutput with correct config', async () => {
		const appCreate: AppCreationResponse = {
			app: { appName: 'app ' } as AppResponse,
			oauthClientId: 'oauthClientId',
			oauthClientSecret: 'oauthClientSecret',
		}
		mockInputAndOutputItem.mockImplementationOnce(async (_command, config) => {
			(config as CustomCommonOutputProducer<AppCreationResponse>).buildTableOutput(appCreate)
		})
		const buildTableSpy = jest.spyOn(DefaultTableGenerator.prototype, 'buildTableFromItem')

		await expect(AppCreateCommand.run([])).resolves.not.toThrow()

		expect(mockInputAndOutputItem).toBeCalledWith(
			expect.any(AppCreateCommand),
			expect.objectContaining({
				buildTableOutput: expect.any(Function),
			}),
			expect.any(Function),
			expect.objectContaining({
				ioFormat: IOFormat.COMMON,
				hasInput: expect.any(Function),
				read: expect.any(Function),
			}),
		)
		expect(buildTableSpy).toBeCalledWith(appCreate.app, tableFieldDefinitions)
	})

	it('calls correct create endpoint', async () => {
		const appRequest = { appName: 'app' } as AppCreateRequest
		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, appRequest)
		})

		await expect(AppCreateCommand.run([])).resolves.not.toThrow()

		expect(createSpy).toBeCalledWith(appRequest)
	})

	it('accepts authorize flag for lambda apps', async () => {
		const arn = 'arn'
		const anotherArn = 'anotherArn'
		const appRequest = {
			lambdaSmartApp: {
				functions: [arn, anotherArn],
			},
		} as AppCreateRequest
		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, appRequest)
		})

		await expect(AppCreateCommand.run(['--authorize'])).resolves.not.toThrow()

		expect(addPermission).toBeCalledTimes(2)
		expect(addPermission).toBeCalledWith(arn, undefined, undefined)
		expect(addPermission).toBeCalledWith(anotherArn, undefined, undefined)
		expect(createSpy).toBeCalledWith(appRequest)
	})

	it('throws error if authorize flag is used on non-lambda app', async () => {
		const appRequest = {
			webhookSmartApp: {},
		} as AppCreateRequest
		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, appRequest)
		})

		await expect(AppCreateCommand.run(['--authorize'])).rejects.toThrow('Authorization is not applicable to WebHook SmartApps')
		expect(createSpy).not.toBeCalled()
	})

	it('ignores authorize flag for lambda apps with no functions', async () => {
		const appRequest = {
			lambdaSmartApp: {
				functions: [],
			},
		} as unknown as AppCreateRequest
		mockInputAndOutputItem.mockImplementation(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, appRequest)
		})

		await expect(AppCreateCommand.run(['--authorize'])).resolves.not.toThrow()

		expect(addPermission).not.toBeCalled()
		expect(createSpy).toBeCalledWith(appRequest)

		createSpy.mockClear()
	})

	it('calls addPermission with principal flag', async () => {
		const arn = 'arn'
		const appRequest = {
			lambdaSmartApp: {
				functions: [arn],
			},
		} as AppCreateRequest
		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, appRequest)
		})

		const principal = 'principal'
		await expect(AppCreateCommand.run(['--authorize', `--principal=${principal}`])).resolves.not.toThrow()

		expect(addPermission).toBeCalledWith(arn, principal, undefined)
	})

	it('calls addPermission with statement-id flag', async () => {
		const arn = 'arn'
		const appRequest = {
			lambdaSmartApp: {
				functions: [arn],
			},
		} as AppCreateRequest
		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, appRequest)
		})

		const statementId = 'statementId'
		await expect(AppCreateCommand.run(['--authorize', `--statement=${statementId}`])).resolves.not.toThrow()

		expect(addPermission).toBeCalledWith(arn, undefined, statementId)
	})

	it('ignores already authorized functions', async () => {
		const arn = 'arn'
		const appRequest = {
			lambdaSmartApp: {
				functions: [arn],
			},
		} as AppCreateRequest
		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, appRequest)
		})

		mockAddPermission.mockResolvedValueOnce('Already authorized')

		await expect(AppCreateCommand.run(['--authorize'])).resolves.not.toThrow()

		expect(addPermission).toBeCalledWith(arn, undefined, undefined)
		expect(logSpy).not.toBeCalledWith('Already authorized')
	})
})
