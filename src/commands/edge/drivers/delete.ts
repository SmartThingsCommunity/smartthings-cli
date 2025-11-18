import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { buildEpilog } from '../../../lib/help.js'
import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../../../lib/command/api-command.js'
import { chooseDriver } from '../../../lib/command/util/drivers-choose.js'


export type CommandArgs =
	& APICommandFlags
	& {
		id?: string
	}

const command = 'edge:drivers:delete [id]'

const describe = 'delete an edge driver'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiCommandBuilder(yargs)
		.positional('driver-id', { describe: 'id of driver to delete', type: 'string' })
		.example([
			['$0 edge:drivers:delete', 'prompt for a driver and delete it'],
			[
				'$0 edge:drivers:delete e61b9758-dfd5-4256-8a68-e411e38572b6',
				'delete the specified driver',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'deleteDriver' }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const id = await chooseDriver(command, argv.id, { promptMessage: 'Select a driver to delete.' })
	await command.client.drivers.delete(id)
	console.log(`Driver ${id} deleted.`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
