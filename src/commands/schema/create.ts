import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type SchemaCreateResponse } from '@smartthings/core-sdk'

import { addSchemaPermission, schemaAWSPrincipal } from '../../lib/aws-util.js'
import { fatalError } from '../../lib/util.js'
import { apiDocsURL } from '../../lib/command/api-command.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../lib/command/api-organization-command.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemFlags,
} from '../../lib/command/basic-io.js'
import { lambdaAuthBuilder, type LambdaAuthFlags } from '../../lib/command/common-flags.js'
import { userInputProcessor } from '../../lib/command/input-processor.js'
import {
	type SchemaAppWithOrganization,
	getSchemaAppCreateFromUser,
} from '../../lib/command/util/schema-util.js'


export type CommandArgs =
	& LambdaAuthFlags
	& APIOrganizationCommandFlags
	& InputAndOutputItemFlags
	& {
		authorize: boolean
	}

const command = 'schema:create'

const describe = 'create an ST Schema connector'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(lambdaAuthBuilder(apiOrganizationCommandBuilder(yargs)))
		.example([
			['$0 schema:create', 'create a schema app from prompted input'],
			[
				'$0 schema:create -i my-schema-app.yaml',
				'create a schema app defined in "my-schema-app.yaml"',
			],
		])
		.option(
			'authorize',
			{
				describe: "authorize connector's Lambda functions to be called by SmartThings",
				type: 'boolean',
				default: false,
			},
		)
		.epilog(apiDocsURL('postApps'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const createApp = async (
			_: void,
			request: SchemaAppWithOrganization,
	): Promise<SchemaCreateResponse> => {
		const { organizationId, ...data } = request
		if (argv.authorize) {
			if (data.hostingType === 'lambda') {
				const principal = argv.principal ?? schemaAWSPrincipal
				const statementId = argv.statement

				if (data.lambdaArn) {
					await addSchemaPermission(data.lambdaArn, principal, statementId)
				}
				if (data.lambdaArnAP) {
					await addSchemaPermission(data.lambdaArnAP, principal, statementId)
				}
				if (data.lambdaArnCN) {
					await addSchemaPermission(data.lambdaArnCN, principal, statementId)
				}
				if (data.lambdaArnEU) {
					await addSchemaPermission(data.lambdaArnEU, principal, statementId)
				}
			} else {
				fatalError('Authorization is not applicable to WebHook schema connectors')
			}
		}
		return command.client.schema.create(data, organizationId)
	}
	await inputAndOutputItem(
		command,
		{ tableFieldDefinitions: ['endpointAppId', 'stClientId', 'stClientSecret'] },
		createApp,
		userInputProcessor(() => getSchemaAppCreateFromUser(command, argv.dryRun ?? false)),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
