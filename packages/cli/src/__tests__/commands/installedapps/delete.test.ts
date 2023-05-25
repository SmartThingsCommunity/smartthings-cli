import { selectFromList } from '@smartthings/cli-lib'
import { InstalledAppsEndpoint } from '@smartthings/core-sdk'
import InstalledAppDeleteCommand from '../../../commands/installedapps/delete.js'


describe('InstalledAppDeleteCommand', () => {
	const deleteSpy = jest.spyOn(InstalledAppsEndpoint.prototype, 'delete').mockImplementation()
	const logSpy = jest.spyOn(InstalledAppDeleteCommand.prototype, 'log').mockImplementation()

	const selectFromListMock = jest.mocked(selectFromList).mockResolvedValue('installedAppId')

	it('prompts user to select app', async () => {
		await expect(InstalledAppDeleteCommand.run(['installedAppId'])).resolves.not.toThrow()

		expect(selectFromListMock).toBeCalledWith(
			expect.any(InstalledAppDeleteCommand),
			expect.objectContaining({
				primaryKeyName: 'installedAppId',
				sortKeyName: 'displayName',
				listTableFieldDefinitions: ['displayName', 'installedAppType', 'installedAppStatus', 'installedAppId'],
			}),
			expect.objectContaining({
				preselectedId: 'installedAppId',
				listItems: expect.any(Function),
				promptMessage: 'Select an installed app to delete.',
			}),
		)
	})

	it('calls correct delete endpoint', async () => {
		await expect(InstalledAppDeleteCommand.run([])).resolves.not.toThrow()

		expect(deleteSpy).toBeCalledWith('installedAppId')
	})

	it('logs to user on successful delete', async () => {
		await expect(InstalledAppDeleteCommand.run([])).resolves.not.toThrow()

		expect(logSpy).toBeCalledWith('Installed app installedAppId deleted.')
	})
})
