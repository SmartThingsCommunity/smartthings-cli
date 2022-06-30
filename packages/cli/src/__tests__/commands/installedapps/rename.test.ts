import { formatAndWriteItem, selectFromList } from '@smartthings/cli-lib'
import { InstalledApp, InstalledAppsEndpoint } from '@smartthings/core-sdk'
import InstalledAppRenameCommand from '../../../commands/installedapps/rename'
import { listTableFieldDefinitions, tableFieldDefinitions } from '../../../lib/commands/installedapps-util'


jest.mock('inquirer')

const MOCK_INSTALLED_APP = { installedAppId: 'installedAppId' } as InstalledApp

describe('InstalledAppRenameCommand', () => {
	const selectFromListMock = jest.mocked(selectFromList).mockResolvedValue('installedAppId')
	const formatAndWriteItemMock = jest.mocked(formatAndWriteItem)

	const updateSpy = jest.spyOn(InstalledAppsEndpoint.prototype, 'update').mockImplementation()
	jest.spyOn(InstalledAppsEndpoint.prototype, 'list').mockImplementation()

	it('prompts user to select an app', async () => {
		await expect(InstalledAppRenameCommand.run(['installedAppId', 'installedAppName'])).resolves.not.toThrow()

		expect(selectFromListMock).toBeCalledWith(
			expect.any(InstalledAppRenameCommand),
			expect.objectContaining({
				itemName: 'installed app',
				primaryKeyName: 'installedAppId',
				sortKeyName: 'displayName',
				tableFieldDefinitions,
				listTableFieldDefinitions,
			}),
			expect.objectContaining({
				preselectedId: 'installedAppId',
				listItems: expect.any(Function),
				promptMessage: 'Select an app to rename.',
			}),
		)
	})

	it('calls correct update endpoint', async () => {
		await expect(InstalledAppRenameCommand.run(['installedAppId', 'installedAppName'])).resolves.not.toThrow()

		expect(updateSpy).toBeCalledWith('installedAppId', { displayName: 'installedAppName' })
	})

	it('outputs updated app to user', async () => {
		updateSpy.mockResolvedValueOnce(MOCK_INSTALLED_APP)

		await expect(InstalledAppRenameCommand.run(['installedAppId', 'installedAppName'])).resolves.not.toThrow()

		expect(formatAndWriteItemMock).toBeCalledWith(
			expect.any(InstalledAppRenameCommand),
			expect.objectContaining({
				itemName: 'installed app',
				primaryKeyName: 'installedAppId',
				sortKeyName: 'displayName',
				tableFieldDefinitions,
				listTableFieldDefinitions,
			}),
			MOCK_INSTALLED_APP,
		)
	})
})
