import { SmartThingsCommand, lambdaAuthFlags } from '@smartthings/cli-lib'
import { addSchemaPermission } from '../../lib/aws-utils.js'


export default class SchemaAppAuthorizeCommand extends SmartThingsCommand<typeof SchemaAppAuthorizeCommand.flags> {
	static description = 'authorize calls to your ST Schema Lambda function from SmartThings'

	static flags = {
		...SmartThingsCommand.flags,
		...lambdaAuthFlags,
	}
	static args = [
		{
			name: 'arn',
			description: 'the ARN of the AWS Lambda function',
			required: true,
		},
	]

	static examples = [
		'$ smartthings schema:authorize arn:aws:lambda:us-east-1:1234567890:function:your-test-app',
		'',
		'Note that this command is the same as running the following with the AWS CLI:',
		'',
		'$ aws lambda add-permission --region us-east-1 \\',
		'    --function-name arn:aws:lambda:us-east-1:1234567890:function:your-test-app \\',
		'    --statement smartthings --principal 148790070172 --action lambda:InvokeFunction',
		'',
		'It requires your machine to be configured to run the AWS CLI',
	]

	async run(): Promise<void> {
		const message = await addSchemaPermission(this.args.arn, this.flags.principal, this.flags.statement)
		this.log(message)
	}
}
