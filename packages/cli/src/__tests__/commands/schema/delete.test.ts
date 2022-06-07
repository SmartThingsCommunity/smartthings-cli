import { selectFromList } from '@smartthings/cli-lib'
import { SchemaEndpoint } from '@smartthings/core-sdk'
import SchemaAppDeleteCommand from '../../../commands/schema/delete'


describe('SchemaAppDeleteCommand', () => {
	const deleteSpy = jest.spyOn(SchemaEndpoint.prototype, 'delete').mockImplementation()
	const logSpy = jest.spyOn(SchemaAppDeleteCommand.prototype, 'log').mockImplementation()

	const selectFromListMock = jest.mocked(selectFromList).mockResolvedValue('schemaAppId')

	it('prompts user to choose app', async () => {
		await expect(SchemaAppDeleteCommand.run(['schemaAppId'])).resolves.not.toThrow()

		expect(selectFromListMock).toBeCalledWith(
			expect.any(SchemaAppDeleteCommand),
			expect.objectContaining({
				primaryKeyName: 'endpointAppId',
				sortKeyName: 'appName',
			}),
			expect.objectContaining({
				preselectedId: 'schemaAppId',
				listItems: expect.any(Function),
				promptMessage: 'Select a schema app to delete.',
			}),
		)
	})

	it('uses correct endpoint to delete app', async () => {
		await expect(SchemaAppDeleteCommand.run([])).resolves.not.toThrow()

		expect(deleteSpy).toBeCalledWith('schemaAppId')
		expect(logSpy).toBeCalledWith('Schema app schemaAppId deleted.')
	})
})
