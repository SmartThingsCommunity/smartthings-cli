import { inputAndOutputItem } from '@smartthings/cli-lib'
import SchemaAppCreateCommand from '../../../commands/schema/create'
import { addSchemaPermission } from '../../../lib/aws-utils'
import { SchemaAppRequest, SchemaCreateResponse, SchemaEndpoint } from '@smartthings/core-sdk'
import { SCHEMA_AWS_PRINCIPAL } from '../../../lib/commands/schema-util'


jest.mock('../../../lib/aws-utils')

describe('SchemaAppCreateCommand', () => {
	const createSpy = jest.spyOn(SchemaEndpoint.prototype, 'create').mockImplementation()

	const inputAndOutputItemMock = jest.mocked(inputAndOutputItem)
	const addSchemaPermissionMock = jest.mocked(addSchemaPermission)

	it('calls inputAndOutputItem with correct config', async () => {
		await expect(SchemaAppCreateCommand.run([])).resolves.not.toThrow()

		expect(inputAndOutputItemMock).toBeCalledWith(
			expect.any(SchemaAppCreateCommand),
			expect.objectContaining({
				tableFieldDefinitions: ['endpointAppId', 'stClientId', 'stClientSecret'],
			}),
			expect.any(Function),
		)
	})

	it('calls correct create endpoint', async () => {
		await expect(SchemaAppCreateCommand.run([])).resolves.not.toThrow()

		const schemaCreateResponse: SchemaCreateResponse = {
			stClientId: 'clientId',
			stClientSecret: 'clientSecret',
		}
		createSpy.mockResolvedValueOnce(schemaCreateResponse)

		const schemaAppRequest: SchemaAppRequest = {
			appName: 'schemaApp',
		}

		const actionFunction = inputAndOutputItemMock.mock.calls[0][2]

		await expect(actionFunction(undefined, schemaAppRequest)).resolves.toStrictEqual(schemaCreateResponse)
		expect(createSpy).toBeCalledWith(schemaAppRequest)
	})

	it('accepts authorize flag and adds permissions for each lambda app region', async () => {
		await expect(SchemaAppCreateCommand.run(['--authorize'])).resolves.not.toThrow()

		const schemaCreateResponse: SchemaCreateResponse = {
			stClientId: 'clientId',
			stClientSecret: 'clientSecret',
		}
		createSpy.mockResolvedValueOnce(schemaCreateResponse)

		const schemaAppRequest: SchemaAppRequest = {
			appName: 'schemaApp',
			hostingType: 'lambda',
			lambdaArn: 'lambdaArn',
			lambdaArnCN: 'lambdaArnCN',
			lambdaArnEU: 'lambdaArnEU',
			lambdaArnAP: 'lambdaArnAP',
		}

		const actionFunction = inputAndOutputItemMock.mock.calls[0][2]

		await expect(actionFunction(undefined, schemaAppRequest)).resolves.toStrictEqual(schemaCreateResponse)

		expect(addSchemaPermissionMock).toBeCalledTimes(4)
		expect(addSchemaPermissionMock).toBeCalledWith(schemaAppRequest.lambdaArn, SCHEMA_AWS_PRINCIPAL, undefined)
		expect(addSchemaPermissionMock).toBeCalledWith(schemaAppRequest.lambdaArnCN, SCHEMA_AWS_PRINCIPAL, undefined)
		expect(addSchemaPermissionMock).toBeCalledWith(schemaAppRequest.lambdaArnEU, SCHEMA_AWS_PRINCIPAL, undefined)
		expect(addSchemaPermissionMock).toBeCalledWith(schemaAppRequest.lambdaArnAP, SCHEMA_AWS_PRINCIPAL, undefined)
		expect(createSpy).toBeCalledWith(schemaAppRequest)
	})

	it('throws error if authorize flag is used on non-lambda app', async () => {
		await expect(SchemaAppCreateCommand.run(['--authorize'])).resolves.not.toThrow()

		const actionFunction = inputAndOutputItemMock.mock.calls[0][2]

		const schemaAppRequest: SchemaAppRequest = {
			hostingType: 'webhook',
		}

		await expect(actionFunction(undefined, schemaAppRequest)).rejects.toThrow('Authorization is not applicable to WebHook schema connectors')
		expect(createSpy).not.toBeCalled()
	})

	it('ignores authorize flag for lambda apps with no ARNs', async () => {
		await expect(SchemaAppCreateCommand.run(['--authorize'])).resolves.not.toThrow()

		const schemaAppRequest: SchemaAppRequest = {
			appName: 'schemaApp',
			hostingType: 'lambda',
		}

		const actionFunction = inputAndOutputItemMock.mock.calls[0][2]

		await expect(actionFunction(undefined, schemaAppRequest)).resolves.not.toThrow()

		expect(addSchemaPermissionMock).toBeCalledTimes(0)
		expect(createSpy).toBeCalledWith(schemaAppRequest)
	})

	it('passes principal flag to addSchemaPermission', async () => {
		const principal = 'principal'
		await expect(SchemaAppCreateCommand.run(['--authorize', `--principal=${principal}`])).resolves.not.toThrow()

		const schemaAppRequest: SchemaAppRequest = {
			appName: 'schemaApp',
			hostingType: 'lambda',
			lambdaArn: 'lambdaArn',
		}

		const actionFunction = inputAndOutputItemMock.mock.calls[0][2]

		await expect(actionFunction(undefined, schemaAppRequest)).resolves.not.toThrow()

		expect(addSchemaPermissionMock).toBeCalledWith(schemaAppRequest.lambdaArn, principal, undefined)
	})

	it('passes statement-id flag to addSchemaPermission', async () => {
		const statementId = 'statementId'
		await expect(SchemaAppCreateCommand.run(['--authorize', `--statement-id=${statementId}`])).resolves.not.toThrow()

		const schemaAppRequest: SchemaAppRequest = {
			appName: 'schemaApp',
			hostingType: 'lambda',
			lambdaArn: 'lambdaArn',
		}

		const actionFunction = inputAndOutputItemMock.mock.calls[0][2]

		await expect(actionFunction(undefined, schemaAppRequest)).resolves.not.toThrow()

		expect(addSchemaPermissionMock).toBeCalledWith(schemaAppRequest.lambdaArn, SCHEMA_AWS_PRINCIPAL, statementId)
	})
})
