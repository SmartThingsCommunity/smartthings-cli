import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { addSchemaPermission } from '../../lib/aws-util.js'
import { lambdaAuthBuilder, type LambdaAuthFlags } from '../../lib/command/common-flags.js'
import {
	smartThingsCommand,
	smartThingsCommandBuilder,
	type SmartThingsCommandFlags,
} from '../../lib/command/smartthings-command.js'


export type CommandArgs =
	& SmartThingsCommandFlags
	& LambdaAuthFlags & {
		arn?: string
	}

const command = 'schema:authorize <arn>'

const describe = 'authorize calls to your Schema App AWS Lambda function from SmartThings'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	lambdaAuthBuilder(smartThingsCommandBuilder(yargs))
		.positional('arn', { describe: 'the ARN of the AWS Lambda function', type: 'string' })
		.example([
			[
				'$0 schema:authorize arn:aws:lambda:us-east-1:1234567890:function:your-test-app',
				'authorize calls to the specified app from SmartThings',
			],
		])
		.epilog('Note that the example above is the same as running the following with the AWS CLI:\n\n' +
			'$ aws lambda add-permission --region us-east-1 \\\n' +
			'    --function-name arn:aws:lambda:us-east-1:1234567890:function:your-test-app \\\n' +
			'    --statement smartthings --principal 148790070172 --action lambda:InvokeFunction\n\n' +
			'It requires your machine to be configured to run the AWS CLI.')

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	await smartThingsCommand(argv)

	// arn is marked as required so will not be null here
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const message = await addSchemaPermission(argv.arn!, argv.principal, argv.statement)
	console.log(message)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
