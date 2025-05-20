import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { apiCommand, apiCommandBuilder, apiDocsURL, type APICommandFlags } from '../../../lib/command/api-command.js'
import { chooseMode } from '../../../lib/command/util/modes-choose.js'


export type CommandArgs =
	& APICommandFlags
	& {
		location?: string
		id?: string
	}

const command = 'locations:modes:delete [id]'

const describe = 'delete a mode'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiCommandBuilder(yargs)
		.positional('id', { describe: 'mode id', type: 'string' })
		.option('location', { alias: 'l', describe: 'a specific location to query', type: 'string' })
		.example([
			['$0 locations:modes:delete', 'choose the mode to delete from a list'],
			[
				'$0 locations:modes:delete --location 5dfd6626-ab1d-42da-bb76-90def3153998',
				'choose the mode to delete from a list of modes in the specified location',
			],
			[
				'$0 locations:modes:delete 636169e4-8b9f-4438-a941-953b0d617231',
				'delete the mode with the specified id',
			],
		])
		.epilog(apiDocsURL('deleteMode'))


const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const [modeId, locationId] = await chooseMode(command, argv.id, { locationId: argv.location })

	const mode = await command.client.modes.get(modeId, locationId)
	const name = mode.label ?? mode.name ?? 'unnamed mode'

	await command.client.modes.delete(modeId, locationId)

	console.log(`${name} (${mode.id}) deleted`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
