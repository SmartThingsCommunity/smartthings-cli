import { APICommand, ChooseOptions, CommonOutputProducer, GetDataFunction, outputItem, SmartThingsCommandInterface } from '@smartthings/cli-lib'
import { AppOAuth, AppsEndpoint } from '@smartthings/core-sdk'
import { v4 as uuid } from 'uuid'
import AppOauthCommand from '../../../commands/apps/oauth'
import { chooseApp } from '../../../lib/commands/apps/apps-util'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		outputItem: jest.fn(),
	}
})

jest.mock('../../../lib/commands/apps/apps-util')

describe('AppOauthCommand', () => {
	const mockOutput = outputItem as unknown as
		jest.Mock<Promise<AppOAuth>, [SmartThingsCommandInterface, CommonOutputProducer<AppOAuth>, GetDataFunction<AppOAuth>]>
	const mockChooseApp = chooseApp as
		jest.Mock<Promise<string>, [APICommand, string | undefined, Partial<ChooseOptions> | undefined]>
	const getOauthSpy = jest.spyOn(AppsEndpoint.prototype, 'getOauth').mockImplementation()

	beforeAll(() => {
		mockOutput.mockImplementation()
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('prompts user to choose app allowing index', async () => {
		await expect(AppOauthCommand.run()).resolves.not.toThrow()

		expect(mockChooseApp).toBeCalledWith(
			expect.any(AppOauthCommand),
			undefined,
			expect.objectContaining({ allowIndex: true }),
		)
	})

	it('calls outputItem with correct config', async () => {
		await expect(AppOauthCommand.run()).resolves.not.toThrow()

		expect(mockOutput).toBeCalledWith(
			expect.any(AppOauthCommand),
			expect.objectContaining({
				tableFieldDefinitions: expect.anything(),
			}),
			expect.any(Function),
		)
	})

	it('uses correct endpoint to get oauth details', async () => {
		const appId = uuid()
		mockChooseApp.mockResolvedValueOnce(appId)
		const appOAuth: AppOAuth = { clientName: 'test' }
		getOauthSpy.mockResolvedValueOnce(appOAuth)
		mockOutput.mockImplementationOnce(async (_command, _config, actionFunction: GetDataFunction<AppOAuth>) => {
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
