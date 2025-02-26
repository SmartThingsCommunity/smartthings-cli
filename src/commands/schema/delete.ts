import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { apiDocsURL } from '../../lib/command/api-command.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../lib/command/api-organization-command.js'
import { chooseSchemaApp } from '../../lib/command/util/schema-util.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& {
		id?: string
	}

export const command = 'schema:delete [id]'

const describe = 'unlink a schema app from smartthings'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiOrganizationCommandBuilder(yargs)
		.positional('id', { describe: 'schema app link id', type: 'string' })
		.example([
			['$0 schema:delete', 'choose the schema app to unlink from a list'],
			[
				'$0 schema:delete 43daec4d-f2c6-4bc3-9df7-50ed1012c137',
				'unlink the schema app with the specified id',
			],
		])
		.epilog(apiDocsURL('deleteAppsByEndpointAppId'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const id = await chooseSchemaApp(command, argv.id, { promptMessage: 'Select a schema app to delete.' })
	await command.client.schema.delete(id)
	console.log(`Schema app link ${id} deleted.`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
