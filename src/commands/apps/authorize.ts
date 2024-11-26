import { ArgumentsCamelCase, Argv, CommandModule } from 'yargs'

import { addPermission } from '../../lib/aws-util.js'
import { lambdaAuthBuilder, LambdaAuthFlags } from '../../lib/command/common-flags.js'
import {
	smartThingsCommand,
	smartThingsCommandBuilder,
	SmartThingsCommandFlags,
} from '../../lib/command/smartthings-command.js'


export type CommandArgs = SmartThingsCommandFlags & LambdaAuthFlags & {
	arn: string
}

const command = 'apps:authorize <arn>'

const describe = 'authorize calls to your AWS Lambda function from SmartThings'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	lambdaAuthBuilder(smartThingsCommandBuilder(yargs))
		.positional(
			'arn',
			{ describe: 'the ARN of the AWS Lambda function', type: 'string', demandOption: true },
		)
		.example([
			[
				'$0 apps:authorize \\\n>  arn:aws:lambda:us-east-1:1234567890:function:your-app',
				'authorize an app',
			],
		])
		.epilog(`NOTE: The example above is the same as running the following with the AWS CLI:

$ aws lambda add-permission --region us-east-1 --function-name \\
>  arn:aws:lambda:us-east-1:1234567890:function:your-app \\
>  --statement smartthings --principal 906037444270 --action lambda:InvokeFunction

This command requires your machine to be configured to run the AWS CLI.`)

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	await smartThingsCommand(argv)

	const message = await addPermission(argv.arn, argv.principal, argv.statement)
	console.log(message)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
