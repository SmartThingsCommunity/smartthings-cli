import { LambdaClient, AddPermissionCommand, AddPermissionRequest } from '@aws-sdk/client-lambda'


export async function addPermission(arn: string, principal = '906037444270', statementId = 'smartthings'): Promise<string> {
	const segs = arn.split(':')
	if (segs.length < 7) {
		return 'Invalid Lambda ARN'
	}

	try {
		const region = segs[3]
		const client = new LambdaClient({ region })

		const params: AddPermissionRequest = {
			Action: 'lambda:InvokeFunction',
			FunctionName: arn,
			Principal: principal,
			StatementId: statementId,
		}

		const command = new AddPermissionCommand(params)

		await client.send(command)

		return 'Authorization added'
	} catch (error) {
		if (error.name === 'ResourceConflictException') {
			return 'Already authorized'
		}
		throw error
	}
}

export function addSchemaPermission(arn: string, principal = '148790070172', statementId = 'smartthings'): Promise<string> {
	return addPermission(arn, principal, statementId)
}

/**
 * Help text for use in `InputDefinition` instances.
 */
export const awsHelpText = 'More information on AWS Lambdas can be found at:\n' +
	'  https://docs.aws.amazon.com/lambda/latest/dg/welcome.html'
