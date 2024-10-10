import { jest } from '@jest/globals'

import type { AddPermissionCommand } from '@aws-sdk/client-lambda'


const command = { isA: 'add permission command' } as unknown as AddPermissionCommand
// eslint-disable-next-line @typescript-eslint/naming-convention
const AddPermissionCommandMock = jest.fn().mockReturnValue(command)
const sendMock = jest.fn()
// eslint-disable-next-line @typescript-eslint/naming-convention
const LambdaClientMock = jest.fn().mockReturnValue({ send: sendMock })
jest.unstable_mockModule('@aws-sdk/client-lambda', () => ({
	AddPermissionCommand: AddPermissionCommandMock,
	LambdaClient: LambdaClientMock,
}))


const {
	addPermission,
	addSchemaPermission,
	schemaAWSPrincipal,
} = await import('../../lib/aws-util.js')


const arn = 'seg0:seg1:seg2:region:seg4:seg5:seg6'

describe('addPermission', () => {
	it('returns "Invalid Lambda ARN" with too few segments', async () => {
		expect(await addPermission('bad arn')).toBe('Invalid Lambda ARN')

		expect(LambdaClientMock).not.toHaveBeenCalled()
		expect(AddPermissionCommandMock).not.toHaveBeenCalled()
	})

	it('returns "Authorization added" when successful', async () => {
		sendMock.mockImplementationOnce(async () => {})

		expect(await addPermission(arn)).toBe('Authorization added')

		expect(LambdaClientMock).toHaveBeenCalledExactlyOnceWith({ region: 'region' })
		expect(AddPermissionCommandMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			Action: 'lambda:InvokeFunction',
			FunctionName: arn,
			Principal: '906037444270',
			StatementId: 'smartthings',
		}))
		expect(sendMock).toHaveBeenCalledExactlyOnceWith(command)
	})

	it('returns "Already Authorized" when already authorized', async () => {
		sendMock.mockImplementationOnce(async () => { throw { name: 'ResourceConflictException' } })

		expect(await addPermission(arn)).toBe('Already authorized')
		expect(AddPermissionCommandMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			Action: 'lambda:InvokeFunction',
			FunctionName: arn,
		}))
		expect(sendMock).toHaveBeenCalledExactlyOnceWith(command)
	})

	it('rethrows unexpected error', async () => {
		const error = Error('unexpected error')
		sendMock.mockImplementationOnce(async () => { throw error })

		await expect(addPermission(arn)).rejects.toThrow(error)
		expect(AddPermissionCommandMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			Action: 'lambda:InvokeFunction',
			FunctionName: arn,
		}))
		expect(sendMock).toHaveBeenCalledExactlyOnceWith(command)
	})
})

test('addSchemaPermission', async () => {
	sendMock.mockImplementationOnce(async () => {})

	expect(await addSchemaPermission(arn)).toBe('Authorization added')

	expect(LambdaClientMock).toHaveBeenCalledExactlyOnceWith({ region: 'region' })
	expect(AddPermissionCommandMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
		Action: 'lambda:InvokeFunction',
		FunctionName: arn,
		Principal: schemaAWSPrincipal,
		StatementId: 'smartthings',
	}))
	expect(sendMock).toHaveBeenCalledExactlyOnceWith(command)
})
