import { SchemaApp, SchemaAppRequest, SchemaEndpoint } from '@smartthings/core-sdk'

import { inputItem, IOFormat, selectFromList } from '@smartthings/cli-lib'

import SchemaUpdateCommand from '../../../commands/schema/update.js'
import { addSchemaPermission } from '../../../lib/aws-utils.js'
import {
	getSchemaAppEnsuringOrganization,
	SchemaAppWithOrganization,
} from '../../../lib/commands/schema-util.js'


jest.mock('../../../lib/aws-utils')
jest.mock('../../../lib/commands/schema-util')


describe('SchemaUpdateCommand', () => {
	const updateSpy = jest.spyOn(SchemaEndpoint.prototype, 'update').mockResolvedValue({ status: 'success' })
	const listSpy = jest.spyOn(SchemaEndpoint.prototype, 'list')
	const logSpy = jest.spyOn(SchemaUpdateCommand.prototype, 'log').mockImplementation()

	const schemaAppRequest = { appName: 'schemaApp' } as SchemaApp
	const schemaAppRequestWithOrganization = {
		...schemaAppRequest,
		organizationId: 'organization-id',
	} as SchemaAppWithOrganization
	const inputItemMock = jest.mocked(inputItem).mockResolvedValue([schemaAppRequestWithOrganization, IOFormat.JSON])
	const addSchemaPermissionMock = jest.mocked(addSchemaPermission)
	const selectFromListMock = jest.mocked(selectFromList).mockResolvedValue('schemaAppId')
	const getSchemaAppMock = jest.mocked(getSchemaAppEnsuringOrganization)
		.mockResolvedValue({ schemaApp: schemaAppRequest, organizationWasUpdated: false })

	it('prompts user to select schema app', async () => {
		const schemaAppList = [{ appName: 'schemaApp' } as SchemaApp]
		listSpy.mockResolvedValueOnce(schemaAppList)

		await expect(SchemaUpdateCommand.run(['schemaAppId'])).resolves.not.toThrow()

		expect(selectFromListMock).toBeCalledWith(
			expect.any(SchemaUpdateCommand),
			expect.objectContaining({
				primaryKeyName: 'endpointAppId',
				sortKeyName: 'appName',
				listTableFieldDefinitions: ['appName', 'endpointAppId', 'hostingType'],
			}),
			expect.objectContaining({
				preselectedId: 'schemaAppId',
				listItems: expect.any(Function),
			}),
		)
		expect(getSchemaAppMock).toHaveBeenCalledTimes(1)
		expect(getSchemaAppMock).toHaveBeenCalledWith(
			expect.any(SchemaUpdateCommand),
			'schemaAppId',
			{ profile: 'default' },
		)

		const listFunction = selectFromListMock.mock.calls[0][2].listItems

		await expect(listFunction()).resolves.toStrictEqual(schemaAppList)
		expect(listSpy).toBeCalledTimes(1)
	})

	it('calls inputItem using default inputProcessors', async () => {
		await expect(SchemaUpdateCommand.run([])).resolves.not.toThrow()

		expect(inputItemMock).toBeCalledWith(
			expect.any(SchemaUpdateCommand),
			expect.anything(),
		)
	})

	it('calls correct update endpoint', async () => {
		await expect(SchemaUpdateCommand.run([])).resolves.not.toThrow()

		expect(updateSpy).toBeCalledWith('schemaAppId', schemaAppRequest, 'organization-id')
	})

	it('logs to stdout when updated', async () => {
		await expect(SchemaUpdateCommand.run([])).resolves.not.toThrow()

		expect(logSpy).toBeCalledWith('Schema schemaAppId updated.')
	})

	it('accepts authorize flag for lambda apps', async () => {
		const schemaAppRequest = {
			appName: 'schemaApp',
			hostingType: 'lambda',
			lambdaArn: 'lambdaArn',
			lambdaArnCN: 'lambdaArnCN',
			lambdaArnEU: 'lambdaArnEU',
			lambdaArnAP: 'lambdaArnAP',
		} as SchemaAppRequest

		inputItemMock.mockResolvedValueOnce([schemaAppRequest, 'json'])

		await expect(SchemaUpdateCommand.run(['--authorize'])).resolves.not.toThrow()

		expect(addSchemaPermissionMock).toBeCalledTimes(4)
		expect(addSchemaPermissionMock).toBeCalledWith(schemaAppRequest.lambdaArn, undefined, undefined)
		expect(addSchemaPermissionMock).toBeCalledWith(schemaAppRequest.lambdaArnCN, undefined, undefined)
		expect(addSchemaPermissionMock).toBeCalledWith(schemaAppRequest.lambdaArnEU, undefined, undefined)
		expect(addSchemaPermissionMock).toBeCalledWith(schemaAppRequest.lambdaArnAP, undefined, undefined)
	})

	it('throws error if authorize flag is used on non-lambda app', async () => {
		const webhookSchemaRequest = {
			appName: 'webhookApp',
			hostingType: 'webhook',
		} as SchemaAppRequest

		inputItemMock.mockResolvedValueOnce([webhookSchemaRequest, 'json'])

		await expect(SchemaUpdateCommand.run(['--authorize'])).rejects.toThrow('Authorization is not applicable to WebHook schema connectors')
		expect(updateSpy).not.toBeCalled()
	})

	it('ignores authorize flag for lambda apps with no ARNs', async () => {
		const noArnSchemaRequest = {
			appName: 'schemaApp',
			hostingType: 'lambda',
		} as SchemaAppRequest

		inputItemMock.mockResolvedValueOnce([noArnSchemaRequest, 'json'])

		await expect(SchemaUpdateCommand.run(['--authorize'])).resolves.not.toThrow()

		expect(addSchemaPermissionMock).toBeCalledTimes(0)
		expect(updateSpy).toBeCalledWith('schemaAppId', noArnSchemaRequest, undefined)
	})
})
