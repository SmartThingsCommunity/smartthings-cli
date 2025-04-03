import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type SchemaAppRequest } from '@smartthings/core-sdk'

import { addSchemaPermission } from '../../lib/aws-util.js'
import { cancelCommand, fatalError } from '../../lib/util.js'
import { apiDocsURL } from '../../lib/command/api-command.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../lib/command/api-organization-command.js'
import { lambdaAuthBuilder, type LambdaAuthFlags } from '../../lib/command/common-flags.js'
import { inputAndOutputItemBuilder, InputAndOutputItemFlags } from '../../lib/command/input-and-output-item.js'
import { inputItem } from '../../lib/command/input-item.js'
import { userInputProcessor } from '../../lib/command/input-processor.js'
import { writeOutput } from '../../lib/command/output.js'
import { buildOutputFormatter } from '../../lib/command/output-builder.js'
import {
	chooseSchemaApp,
	getSchemaAppEnsuringOrganization,
	getSchemaAppUpdateFromUser,
	type SchemaAppWithOrganization,
} from '../../lib/command/util/schema-util.js'


// Using flags and builder from `inputAndOutputItem` since we're doing the same things it does.
export type CommandArgs =
	& APIOrganizationCommandFlags
	& LambdaAuthFlags
	& InputAndOutputItemFlags
	& {
		authorize?: boolean
		id?: string
	}

const command = 'schema:update [id]'

const describe = 'update a link to a Schema App'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(lambdaAuthBuilder(apiOrganizationCommandBuilder(yargs)))
		.positional('id', { describe: 'the Schema App link id', type: 'string' })
		.option('authorize', { describe: 'authorize Lambda functions to be called by SmartThings', type: 'boolean' })
		.example([
			[
				'$0 schema:update',
				'update a Schema App link by answering questions',
			],
			[
				'$0 schema:update -d',
				'generate JSON for updating a Schema App link by answering questions',
			],
			[
				'$0 schema:update -i data.yaml',
				'update a Schema App link with the definition in the file data.yaml',
			],
		])
		.epilog(apiDocsURL('putAppsByEndpointAppId'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const id = await chooseSchemaApp(command, argv.id)

	const { schemaApp: original, organizationWasUpdated } = await getSchemaAppEnsuringOrganization(command, id, argv)
	if (original.certificationStatus === 'wwst' ||
			original.certificationStatus === 'cst' ||
			original.certificationStatus === 'review') {
		const cancelMsgBase =
			'Schema Apps that have already been certified cannot be updated via the CLI'
		const cancelMsg = organizationWasUpdated
			? cancelMsgBase + ' so further updates are not possible.'
			: cancelMsgBase + '.'
		return cancelCommand(cancelMsg)
	}

	const getInputFromUser = async (): Promise<SchemaAppRequest> =>
		getSchemaAppUpdateFromUser(command, original, !!argv.dryRun)

	// We use `inputItem` instead of `inputAndOutputItem` because the API does not return the
	// updated object like most other APIs.
	const [request, defaultIOFormat] =
		await inputItem<SchemaAppWithOrganization>(argv, userInputProcessor(getInputFromUser))
	if (argv.dryRun) {
		const outputFormatter = buildOutputFormatter(command.flags, command.cliConfig, defaultIOFormat)
		await writeOutput(outputFormatter(request), command.flags.output)
		return
	}

	if (argv.authorize) {
		if (request.hostingType === 'lambda') {
			if (request.lambdaArn) {
				await addSchemaPermission(request.lambdaArn, argv.principal, argv.statement)
			}
			if (request.lambdaArnAP) {
				await addSchemaPermission(request.lambdaArnAP, argv.principal, argv.statement)
			}
			if (request.lambdaArnCN) {
				await addSchemaPermission(request.lambdaArnCN, argv.principal, argv.statement)
			}
			if (request.lambdaArnEU) {
				await addSchemaPermission(request.lambdaArnEU, argv.principal, argv.statement)
			}
		} else {
			return fatalError('Authorization is not applicable to WebHook schema connectors.')
		}
	}
	const { organizationId, ...data } = request
	const result = await command.client.schema.update(id, data, organizationId)
	if (result.status !== 'success') {
		return fatalError(`Error ${result.status} updating ${id}.`)
	}
	console.log(`Schema ${id} updated.`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
