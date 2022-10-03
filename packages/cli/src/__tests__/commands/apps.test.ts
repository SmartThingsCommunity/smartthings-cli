import { ListDataFunction, outputItemOrList } from '@smartthings/cli-lib'
import { AppResponse, AppClassification, AppsEndpoint, AppType, PagedApp, SmartThingsClient } from '@smartthings/core-sdk'
import AppsCommand from '../../commands/apps'
import { shortARNorURL, verboseApps } from '../../lib/commands/apps-util'


jest.mock('../../lib/commands/apps-util')

describe('AppsCommand', () => {
	const app = { appId: 'app-id', webhookSmartApp: { targetUrl: 'targetUrl' } } as AppResponse
	const appList = [{ appId: 'paged-app-id' }] as PagedApp[]
	const verboseAppList = [{ appId: 'verbose-app-id' }] as AppResponse[]
	const mockOutputListing = jest.mocked(outputItemOrList<AppResponse, PagedApp | AppResponse>)
	const getSpy = jest.spyOn(AppsEndpoint.prototype, 'get').mockImplementation()
	const listSpy = jest.spyOn(AppsEndpoint.prototype, 'list').mockImplementation()
	const verboseAppsMock = jest.mocked(verboseApps)

	const listItemsForArgs = async (args: string[]): Promise<ListDataFunction<PagedApp | AppResponse>> => {
		await expect(AppsCommand.run(args)).resolves.not.toThrow()
		return mockOutputListing.mock.calls[0][3]
	}

	listSpy.mockResolvedValue(appList)
	verboseAppsMock.mockResolvedValue(verboseAppList)

	it('calls outputItemOrList with correct config', async () => {
		await expect(AppsCommand.run([])).resolves.not.toThrow()

		expect(outputItemOrList).toBeCalledWith(
			expect.any(AppsCommand),
			expect.objectContaining({
				primaryKeyName: 'appId',
				sortKeyName: 'displayName',
				listTableFieldDefinitions: expect.not.arrayContaining([{ label: 'ARN/URL', value: shortARNorURL }]),
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)
	})

	it('calls correct get endpoint', async () => {
		await expect(AppsCommand.run(['app-id'])).resolves.not.toThrow()

		const getItem = mockOutputListing.mock.calls[0][4]
		getSpy.mockResolvedValueOnce(app)

		expect(await getItem('app-id')).toBe(app)

		expect(getSpy).toHaveBeenCalledTimes(1)
		expect(getSpy).toHaveBeenCalledWith('app-id')
	})

	describe('listItems', () => {
		const appType = AppType.LAMBDA_SMART_APP

		it('calls correct list endpoint', async () => {
			const listItems = await listItemsForArgs([])

			expect(await listItems()).toBe(appList)

			expect(listSpy).toHaveBeenCalledTimes(1)
			expect(listSpy).toHaveBeenCalledWith({})
			expect(verboseAppsMock).toHaveBeenCalledTimes(0)
		})

		it('takes an app type to filter by via flags', async () => {
			const listItems = await listItemsForArgs([`--type=${appType}`])

			expect(await listItems()).toBe(appList)

			expect(listSpy).toHaveBeenCalledTimes(1)
			expect(listSpy).toHaveBeenCalledWith({ appType: `${appType}` })
			expect(verboseAppsMock).toHaveBeenCalledTimes(0)
		})

		it('does not accept multiple app types', async () => {
			const listItems = await listItemsForArgs(['--type=LAMBDA_SMART_APP', `--type=${appType}`])

			expect(await listItems()).toBe(appList)

			expect(listSpy).toHaveBeenCalledTimes(1)
			expect(listSpy).toHaveBeenCalledWith({ appType: `${appType}` })
			expect(verboseAppsMock).toHaveBeenCalledTimes(0)
		})

		it('ignores invalid app types', async () => {
			const listItems = await listItemsForArgs(['--type=INVALID_APP_TYPE'])

			expect(await listItems()).toBe(appList)

			expect(listSpy).toHaveBeenCalledTimes(1)
			expect(listSpy).toHaveBeenCalledWith({ appType: undefined })
			expect(verboseAppsMock).toHaveBeenCalledTimes(0)
		})

		const automation = AppClassification.AUTOMATION
		const service = AppClassification.SERVICE
		it('accepts a single classification for filtering', async () => {
			const listItems = await listItemsForArgs([`--classification=${automation}`])

			expect(await listItems()).toBe(appList)

			expect(listSpy).toHaveBeenCalledTimes(1)
			expect(listSpy).toHaveBeenCalledWith({ classification: [automation] })
			expect(verboseAppsMock).toHaveBeenCalledTimes(0)
		})

		it('accepts multiple classifications for filtering', async () => {
			const classifications = [automation, service]
			const listItems = await listItemsForArgs([`--classification=${automation}`, `--classification=${service}`])

			expect(await listItems()).toBe(appList)

			expect(listSpy).toHaveBeenCalledTimes(1)
			expect(listSpy).toHaveBeenCalledWith({ classification: expect.arrayContaining(classifications) })
			expect(verboseAppsMock).toHaveBeenCalledTimes(0)
		})

		it('ignores invalid app classifications', async () => {
			const listItems = await listItemsForArgs([`--classification=${automation}`, '--classification=INVALID'])

			expect(await listItems()).toBe(appList)

			expect(listSpy).toHaveBeenCalledTimes(1)
			expect(listSpy).toHaveBeenCalledWith({ classification: [automation, undefined] })
			expect(verboseAppsMock).toHaveBeenCalledTimes(0)
		})
	})

	it('includes URLs and ARNs in output when verbose flag is used', async () => {
		const listItems = await listItemsForArgs(['--verbose'])

		expect(outputItemOrList).toBeCalledWith(
			expect.any(AppsCommand),
			expect.objectContaining({
				listTableFieldDefinitions: expect.arrayContaining([{ label: 'ARN/URL', value: shortARNorURL }]),
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		expect(await listItems()).toBe(verboseAppList)

		expect(listSpy).toHaveBeenCalledTimes(0)
		expect(verboseAppsMock).toHaveBeenCalledTimes(1)
		expect(verboseAppsMock).toHaveBeenCalledWith(expect.any(SmartThingsClient), {})
	})
})
