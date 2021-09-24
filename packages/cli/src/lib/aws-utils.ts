import AWS from 'aws-sdk'
import { AddPermissionRequest, FunctionName, Principal, StatementId } from 'aws-sdk/clients/lambda'


export async function addPermission(arn: FunctionName, principal: Principal = '906037444270', statementId: StatementId = 'smartthings'): Promise<string> {
	const segs = arn.split(':')
	if (segs.length < 7) {
		return 'Invalid Lambda ARN'
	}

	try {
		const region = segs[3]
		AWS.config.update({ region })
		const lambda = new AWS.Lambda()

		const params: AddPermissionRequest = {
			Action: 'lambda:InvokeFunction',
			FunctionName: arn,
			Principal: principal,
			StatementId: statementId,
		}

		await lambda.addPermission(params).promise()
		return 'Authorization added'
	} catch (error) {
		if (error.code === 'ResourceConflictException') {
			return 'Already authorized'
		}
		throw error
	}
}

export function addSchemaPermission(arn: FunctionName, principal: Principal = '148790070172', statementId: StatementId = 'smartthings'): Promise<string> {
	return addPermission(arn, principal, statementId)
}
