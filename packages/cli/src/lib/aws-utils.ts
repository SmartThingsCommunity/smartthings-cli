import AWS from 'aws-sdk'
import {AddPermissionRequest} from 'aws-sdk/clients/lambda'


export async function addPermission(arn: string): Promise<string> {
	const segs = arn.split(':')
	if (segs.length < 7) {
		return 'Invalid Lambda ARN'
	}

	try {
		const region = segs[3]
		AWS.config.update({region})
		const lambda = new AWS.Lambda()

		const params: AddPermissionRequest = {
			Action: 'lambda:InvokeFunction',
			FunctionName: arn,
			Principal: '906037444270', // TODO environment dependent
			StatementId: 'smartthings',
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
