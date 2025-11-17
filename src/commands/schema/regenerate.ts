import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { buildEpilog } from '../../lib/help.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../lib/command/api-organization-command.js'
import { outputItem, outputItemBuilder, OutputItemFlags } from '../../lib/command/output-item.js'
import { chooseSchemaApp } from '../../lib/command/util/schema-util.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& OutputItemFlags
	& {
		id?: string
	}

const command = 'schema:regenerate [id]'

const describe = 'regenerate the client id and secret of the Schema App link'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemBuilder(apiOrganizationCommandBuilder(yargs))
		.positional('id', {
			describe: 'Schema App link id',
			type: 'string',
		})
		.example([
			['$0 schema:regenerate', 'prompt for Schema App link and regenerate the client id and secret for it'],
			[
				'$0 schema:regenerate 392bcb11-e251-44f3-b58b-17f93015f3aa',
				'regenerate the client id and secret for for the specified Schema App link',
			],
		])
		.epilog(buildEpilog({
			command,
			apiDocs: ['generateStOauthCredentials'],
			formattedNotes: 'The previous values will be invalidated, which may affect existing installations.',
		}))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const id = await chooseSchemaApp(
		command,
		argv.id,
		{ promptMessage: 'Select a schema app to regenerate its client id and secret.' },
	)

	await outputItem(
		command,
		{ tableFieldDefinitions: ['endpointAppId', 'stClientId', 'stClientSecret'] },
		() => command.client.schema.regenerateOauth(id),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
