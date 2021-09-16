import { SmartThingsCommand, lambdaAuthFlags } from '@smartthings/cli-lib'

import { addPermission } from '../../lib/aws-utils'


export const SCHEMA_AWS_PRINCIPAL = '148790070172'

export default class SchemaAppAuthorizeCommand extends SmartThingsCommand {
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
		'    --statement-id smartthings --principal 148790070172 --action lambda:InvokeFunction',
		'',
		'It requires your machine to be configured to run the AWS CLI',
	]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(SchemaAppAuthorizeCommand)
		await super.setup(args, argv, flags)

		const principal = flags.principal ?? SCHEMA_AWS_PRINCIPAL
		const statementId = flags['statement-id']

		addPermission(args.arn, principal, statementId).then(async (message) => {
			this.log(message)
		}).catch(err => {
			this.log(`caught error ${err}`)
		})
	}
}
