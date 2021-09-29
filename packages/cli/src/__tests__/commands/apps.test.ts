import { outputListing } from '@smartthings/cli-lib'
import { AppClassification, AppsEndpoint, AppType } from '@smartthings/core-sdk'
import AppsCommand from '../../commands/apps'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		outputListing: jest.fn(),
	}
})

describe('AppsCommand', () => {
	const appId = 'appId'
	const mockOutputListing = outputListing as unknown as jest.Mock
	const getSpy = jest.spyOn(AppsEndpoint.prototype, 'get').mockImplementation()
	const listSpy = jest.spyOn(AppsEndpoint.prototype, 'list').mockImplementation()

	beforeAll(() => {
		mockOutputListing.mockImplementation(async (_command, _config, _id, listFunction) => {
			await listFunction()
		})
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('calls outputListing with correct config', async () => {
		await expect(AppsCommand.run()).resolves.not.toThrow()

		expect(outputListing).toBeCalledWith(
			expect.any(AppsCommand),
			expect.objectContaining({
				primaryKeyName: 'appId',
				sortKeyName: 'displayName',
				listTableFieldDefinitions: expect.not.arrayContaining(['ARN/URL']),
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)
	})

	it('calls correct get endpoint', async () => {
		mockOutputListing.mockImplementationOnce(async (_command, _config, _id, _listFunction, getFunction) => {
			await getFunction(appId)
		})

		await expect(AppsCommand.run([appId])).resolves.not.toThrow()
		expect(outputListing).toBeCalledWith(
			expect.anything(),
			expect.anything(),
			appId,
			expect.anything(),
			expect.anything(),
		)
		expect(getSpy).toBeCalledWith(appId)
	})

	it('calls correct list endpoint', async () => {
		await expect(AppsCommand.run()).resolves.not.toThrow()
		expect(listSpy).toBeCalled()
	})

	it('takes an app type to filter by via flags', async () => {
		const appType = AppType.LAMBDA_SMART_APP

		await expect(AppsCommand.run([`--type=${appType}`])).resolves.not.toThrow()
		expect(listSpy).toBeCalledWith(
			expect.objectContaining({
				appType: `${appType}`,
			}),
		)
	})

	it('does not accept multiple app types', async () => {
		const appType = AppType.WEBHOOK_SMART_APP

		await expect(AppsCommand.run(['--type=LAMBDA_SMART_APP', `--type=${appType}`])).resolves.not.toThrow()
		expect(listSpy).toBeCalledWith(
			expect.objectContaining({
				appType: `${appType}`,
			}),
		)
	})

	it('ignores invalid app types', async () => {
		await expect(AppsCommand.run(['--type=INVALID_APP_TYPE'])).resolves.not.toThrow()
		expect(listSpy).toBeCalledWith(
			expect.objectContaining({
				appType: undefined,
			}),
		)
	})

	it('takes one or more classifications to filter by via flags', async () => {
		const automation = AppClassification.AUTOMATION

		await expect(AppsCommand.run([`--classification=${automation}`])).resolves.not.toThrow()
		expect(listSpy).toBeCalledWith(
			expect.objectContaining({
				classification: expect.arrayContaining([automation]),
			}),
		)

		const service = AppClassification.SERVICE
		const classifications = [automation, service]

		await expect(AppsCommand.run([`--classification=${automation}`, `--classification=${service}`])).resolves.not.toThrow()
		expect(listSpy).toBeCalledWith(
			expect.objectContaining({
				classification: expect.arrayContaining(classifications),
			}),
		)
	})

	it('ignores invalid app classifications', async () => {
		const automation = AppClassification.AUTOMATION

		await expect(AppsCommand.run([`--classification=${automation}`, '--classification=INVALID'])).resolves.not.toThrow()
		expect(listSpy).toBeCalledWith(
			expect.objectContaining({
				classification: expect.arrayContaining([automation, undefined]),
			}),
		)
	})

	it('includes URLs and ARNs in output when verbose flag is used', async () => {
		mockOutputListing.mockResolvedValueOnce(undefined)
		listSpy.mockResolvedValueOnce([])

		await expect(AppsCommand.run(['--verbose'])).resolves.not.toThrow()
		expect(outputListing).toBeCalledWith(
			expect.anything(),
			expect.objectContaining({
				listTableFieldDefinitions: expect.arrayContaining(['ARN/URL']),
			}),
			undefined,
			expect.anything(),
			expect.anything(),
		)
	})

	test.todo('listApps includes URLs and ARNs')
})
