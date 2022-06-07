import { outputItem, selectFromList } from '@smartthings/cli-lib'
import { SchemaEndpoint, SchemaCreateResponse } from '@smartthings/core-sdk'
import SchemaAppRegenerateCommand from '../../../commands/schema/regenerate'


describe('SchemaAppRegenerateCommand', () => {
	const regenerateOauthSpy = jest.spyOn(SchemaEndpoint.prototype, 'regenerateOauth').mockImplementation()
	const listSpy = jest.spyOn(SchemaEndpoint.prototype, 'list').mockImplementation()


	const selectFromListMock = jest.mocked(selectFromList).mockResolvedValue('schemaAppId')
	const outputItemMock = jest.mocked(outputItem)

	it('prompts user to select schema app', async () => {
		await expect(SchemaAppRegenerateCommand.run(['schemaAppId'])).resolves.not.toThrow()

		expect(selectFromListMock).toBeCalledWith(
			expect.any(SchemaAppRegenerateCommand),
			expect.objectContaining({
				primaryKeyName: 'endpointAppId',
				sortKeyName: 'appName',
			}),
			expect.objectContaining({
				preselectedId: 'schemaAppId',
				listItems: expect.any(Function),
				promptMessage: 'Select a schema app to regenerate its clientId and clientSecret.',
			}),
		)
	})

	it('calls correct list endpoint', async () => {
		const list = [{ appName: 'schemaApp' }]
		listSpy.mockResolvedValueOnce(list)

		await expect(SchemaAppRegenerateCommand.run(['schemaAppId'])).resolves.not.toThrow()

		const listFunction = selectFromListMock.mock.calls[0][2].listItems

		await expect(listFunction()).resolves.toStrictEqual(list)
	})

	it('calls outputItem with correct config', async () => {
		await expect(SchemaAppRegenerateCommand.run(['schemaAppId'])).resolves.not.toThrow()

		expect(outputItemMock).toBeCalledWith(
			expect.any(SchemaAppRegenerateCommand),
			expect.objectContaining({
				tableFieldDefinitions: ['endpointAppId', 'stClientId', 'stClientSecret'],
			}),
			expect.any(Function),
		)
	})

	it('calls correct regenerate endpoint', async () => {
		const schemaCreateResponse: SchemaCreateResponse = {
			stClientId: 'clientId',
			stClientSecret: 'clientSecret',
			endpointAppId: 'schemaAppId',
		}

		regenerateOauthSpy.mockResolvedValueOnce(schemaCreateResponse)

		await expect(SchemaAppRegenerateCommand.run(['schemaAppId'])).resolves.not.toThrow()

		const regenerateFunction = outputItemMock.mock.calls[0][2]

		await expect(regenerateFunction()).resolves.toStrictEqual(schemaCreateResponse)
		expect(regenerateOauthSpy).toBeCalledWith('schemaAppId')
	})
})
