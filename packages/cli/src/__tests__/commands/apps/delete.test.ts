import { AppsEndpoint } from '@smartthings/core-sdk'
import AppDeleteCommand from '../../../commands/apps/delete'
import { chooseApp } from '../../../lib/commands/apps/apps-util'


jest.mock('../../../lib/commands/apps/apps-util')

describe('AppDeleteCommand', () => {
	const appId = 'appId'
	const mockChooseApp = jest.mocked(chooseApp)
	const deleteSpy = jest.spyOn(AppsEndpoint.prototype, 'delete').mockImplementation()
	const logSpy = jest.spyOn(AppDeleteCommand.prototype, 'log').mockImplementation()

	it('prompts user to choose app', async () => {
		await expect(AppDeleteCommand.run([])).resolves.not.toThrow()

		expect(chooseApp).toBeCalledWith(expect.any(AppDeleteCommand), undefined)
	})

	it('uses correct endpoint to delete app', async () => {
		mockChooseApp.mockResolvedValueOnce(appId)

		await expect(AppDeleteCommand.run([appId])).resolves.not.toThrow()

		expect(chooseApp).toBeCalledWith(expect.any(AppDeleteCommand), appId)
		expect(deleteSpy).toBeCalledWith(appId)
		expect(logSpy).toBeCalledWith(`App ${appId} deleted.`)
	})
})
