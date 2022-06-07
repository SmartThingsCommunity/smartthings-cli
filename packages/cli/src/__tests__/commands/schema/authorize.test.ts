import SchemaAppAuthorizeCommand from '../../../commands/schema/authorize'
import { addSchemaPermission } from '../../../lib/aws-utils'


jest.mock('../../../lib/aws-utils')

describe('SchemaAppAuthorizeCommand', () => {
	const addSchemaPermissionMock = jest.mocked(addSchemaPermission).mockResolvedValue('Authorization added')
	const logSpy = jest.spyOn(SchemaAppAuthorizeCommand.prototype, 'log').mockImplementation()

	it('requires ARN arg', async () => {
		await expect(SchemaAppAuthorizeCommand.run([])).rejects.toThrow('Missing 1 required arg:\narn')
	})

	it('calls addSchemaPermission with required ARN', async () => {
		await expect(SchemaAppAuthorizeCommand.run(['ARN'])).resolves.not.toThrow()

		expect(addSchemaPermissionMock).toBeCalledWith('ARN', undefined, undefined)
		expect(logSpy).toBeCalledWith('Authorization added')
	})

	it('passes principal flag to addSchemaPermission', async () => {
		await expect(SchemaAppAuthorizeCommand.run(['ARN', '--principal=principal'])).resolves.not.toThrow()

		expect(addSchemaPermissionMock).toBeCalledWith('ARN', 'principal', undefined)
	})

	it('passes statement-id flag to addSchemaPermission', async () => {
		await expect(SchemaAppAuthorizeCommand.run(['ARN', '--statement-id=statementId'])).resolves.not.toThrow()

		expect(addSchemaPermissionMock).toBeCalledWith('ARN', undefined, 'statementId')
	})

	it('throws unexpected errors', async () => {
		const error = new Error('unexpected')
		addSchemaPermissionMock.mockRejectedValueOnce(error)

		await expect(SchemaAppAuthorizeCommand.run(['ARN'])).rejects.toThrow(error)
	})
})
