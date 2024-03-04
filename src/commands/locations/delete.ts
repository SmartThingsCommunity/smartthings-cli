import { ArgumentsCamelCase, Argv, CommandModule } from 'yargs'

import { APICommandFlags, apiCommand, apiCommandBuilder, apiDocsURL } from '../../lib/command/api-command.js'
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
			['$0 locations:delete my-location-id', 'delete the location with the specified id'],
		])
		.epilog(apiDocsURL('deleteLocation'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const id = await chooseLocation(command, argv.id)
	await command.client.locations.delete(id)
	console.log(`Location ${id} deleted.`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
