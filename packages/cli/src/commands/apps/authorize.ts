import { SmartThingsCommand, lambdaAuthFlags } from '@smartthings/cli-lib'
import { addPermission } from '../../lib/aws-utils'


export default class AppsAuthorizeCommand extends SmartThingsCommand {
	static description = 'authorize calls to your AWS Lambda function from SmartThings'

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
		'$ smartthings apps:authorize arn:aws:lambda:us-east-1:1234567890:function:your-test-app',
		'',
		'Note that this command is the same as running the following with the AWS CLI:',
		'',
		'$ aws lambda add-permission --region us-east-1 \\',
		'    --function-name arn:aws:lambda:us-east-1:1234567890:function:your-test-app \\',
		'    --statement-id smartthings --principal 906037444270 --action lambda:InvokeFunction',
		'',
		'It requires your machine to be configured to run the AWS CLI',
	]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(AppsAuthorizeCommand)
		await super.setup(args, argv, flags)

		const message = await addPermission(args.arn, flags.principal, flags['statement-id'])
		this.log(message)
	}
}
