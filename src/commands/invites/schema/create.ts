import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type SchemaAppInvitationCreate } from '@smartthings/core-sdk'

import { buildEpilog } from '../../../lib/help.js'
import {
	apiCommand,
	apiCommandBuilder,
	type APICommandFlags,
} from '../../../lib/command/api-command.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemFlags,
} from '../../../lib/command/input-and-output-item.js'
import { userInputProcessor } from '../../../lib/command/input-processor.js'
import { getSchemaAppEnsuringOrganization } from '../../../lib/command/util/schema-util.js'
import { getSingleInvite, type InvitationWithAppDetails } from '../../../lib/command/util/schema-invites.js'
import { getInputFromUser } from '../../../lib/command/util/schema-invites-user-input.js'
import { tableFieldDefinitions } from '../../../lib/command/util/schema-invites-table.js'


export type CommandArgs =
	& APICommandFlags
	& InputAndOutputItemFlags
	& {
		schemaApp?: string
	}

const command = 'invites:schema:create'

const describe = 'create an invitation to a schema app'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiCommandBuilder(yargs))
		.option('schema-app', { describe: 'schema app link id', type: 'string' })
		.example([
			['$0 invites:schema:create', 'create an invitation from prompted input'],
			[
				'$0 invites:schema:create --schema-app d2e44c34-3cb1-42be-b5ba-8fbaf2922c19',
				'create an invitation for the specified Schema App from prompted input',
			],
			[
				'$0 invites:schema:create -i invitation.json',
				'create an invitation as defined in invitation.json, prompting the user for a schema-app',
			],
			[
				'$0 invites:schema:create -i invitation.json --schema-app d2e44c34-3cb1-42be-b5ba-8fbaf2922c19',
				'create an invitation as defined in invitation.json with the specified schema-app',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'createSchemaAppInvite' }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const createInvitation = async (
			_: unknown,
			input: SchemaAppInvitationCreate,
	): Promise<InvitationWithAppDetails> => {
		// We don't need the full schema app but using `getSchemaAppEnsuringOrganization`
		// ensures there is a valid organization associated with the schema app.
		await getSchemaAppEnsuringOrganization(command, input.schemaAppId, argv)
		const idWrapper = await command.client.invitesSchema.create(input)
		return getSingleInvite(command.client, input.schemaAppId, idWrapper.invitationId)
	}
	await inputAndOutputItem<SchemaAppInvitationCreate, InvitationWithAppDetails>(
		command,
		{ tableFieldDefinitions },
		createInvitation,
		userInputProcessor(() => getInputFromUser(command, argv)),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
