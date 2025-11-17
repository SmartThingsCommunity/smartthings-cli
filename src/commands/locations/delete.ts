import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { buildEpilog } from '../../lib/help.js'
import {
	type APICommandFlags,
	apiCommand,
	apiCommandBuilder,
} from '../../lib/command/api-command.js'
import { chooseLocation } from '../../lib/command/util/locations-util.js'


export type CommandArgs = APICommandFlags & {
	id?: string
}

export const command = 'locations:delete [id]'

const describe = 'delete a location'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiCommandBuilder(yargs)
		.positional('id', { describe: 'location id', type: 'string' })
		.example([
			['$0 locations:delete', 'choose the location to delete from a list'],
			[
				'$0 locations:delete 43daec4d-f2c6-4bc3-9df7-50ed1012c137',
				'delete the location with the specified id',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'deleteLocation' }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const id = await chooseLocation(command, argv.id)
	await command.client.locations.delete(id)
	console.log(`Location ${id} deleted.`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
