import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../../../lib/command/api-command.js'

import { chooseSchemaInvitationFn } from '../../../lib/command/util/schema-invites-choose.js'


export type CommandArgs =
	& APICommandFlags
	& {
		id?: string
		schemaApp?: string
	}

export const command = 'invites:schema:delete [id]'

const describe = 'delete a Schema App invitation'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiCommandBuilder(yargs)
		.positional('id', { describe: 'Schema App invitation id', type: 'string' })
		.option('schema-app', { describe: 'Schema App id', type: 'string' })
		.example([
			[
				'$0 invites:schema:delete',
				'choose the invitation to delete from a list',
			],
			[
				'$0 invites:schema:delete --schema-app e077532e-3c0f-4f3b-a1d8-029115ee1602',
				'choose the invitation to delete from a list of invitations for the specified Schema App',
			],
			[
				'$0 invites:schema:delete 5dfd6626-ab1d-42da-bb76-90def3153998',
				'delete the invitation with the specified id',
			],
		])

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const id = await chooseSchemaInvitationFn(argv.schemaApp)(command, argv.id)
	await command.client.invitesSchema.revoke(id)
	console.log(`Invitation ${id} deletion requested. (This may take a few moments to complete.)`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
