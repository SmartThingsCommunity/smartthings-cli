import { LambdaClient, AddPermissionCommand, AddPermissionRequest } from '@aws-sdk/client-lambda'


export const addPermission = async (
		arn: string,
		principal = '906037444270',
		statementId = 'smartthings',
): Promise<string> => {
	const segments = arn.split(':')
	if (segments.length < 7) {
		return 'Invalid Lambda ARN'
	}

	try {
		const region = segments[3]
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

export const schemaAWSPrincipal = '148790070172'
export const addSchemaPermission = (
		arn: string,
		principal = schemaAWSPrincipal,
		statementId = 'smartthings',
): Promise<string> => addPermission(arn, principal, statementId)

/**
 * Help text for use in `InputDefinition` instances.
 */
export const awsHelpText = 'More information on AWS Lambdas can be found at:\n' +
	'  https://docs.aws.amazon.com/lambda/latest/dg/welcome.html'
