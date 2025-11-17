import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { buildEpilog } from '../../lib/help.js'
import {
	type APICommandFlags,
	apiCommand,
	apiCommandBuilder,
} from '../../lib/command/api-command.js'
import { chooseApp } from '../../lib/command/util/apps-util.js'


export type CommandArgs = APICommandFlags & {
	id?: string
}

const command = 'apps:delete [id]'

const describe = 'delete an app'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiCommandBuilder(yargs)
		.positional('id', { describe: 'app id', type: 'string' })
		.example([
			['$0 apps:delete', 'choose the app to delete from a list'],
			[
				'$0 apps:delete 5dfd6626-ab1d-42da-bb76-90def3153998',
				'delete the app with the specified id',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'deleteApp' }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const id = await chooseApp(command, argv.id)
	await command.client.apps.delete(id)
	console.log(`App ${id} deleted.`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
