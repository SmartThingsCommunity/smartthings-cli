import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { apiCommand, apiCommandBuilder, apiDocsURL, type APICommandFlags } from '../../../lib/command/api-command.js'
import { chooseMode } from '../../../lib/command/util/modes-choose.js'


export type CommandArgs =
	& APICommandFlags
	& {
		location?: string
		id?: string
	}

const command = 'locations:modes:setcurrent [id]'

const describe = 'set the current mode'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiCommandBuilder(yargs)
		.positional('id', { describe: 'mode id', type: 'string' })
		.option('location', { alias: 'l', describe: 'a specific location to query', type: 'string' })
		.example([
			[
				'$0 locations:modes:setcurrent',
				'select a mode from a list of all modes and set it to be current for its location',
			],
			[
				'$0 locations:modes:setcurrent --location 5dfd6626-ab1d-42da-bb76-90def3153998',
				'select a mode from a list of modes in the specified location and set it to be current',
			],
			[
				'$0 locations:modes:setcurrent 636169e4-8b9f-4438-a941-953b0d617231',
				'set the specified mode to be current for its location',
			],
		])
		.epilog(apiDocsURL('changeMode'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const [modeId, locationId] = await chooseMode(command, argv.id, { locationId: argv.location })
	await command.client.modes.setCurrent(modeId, locationId)

	const mode = await command.client.modes.get(modeId, locationId)
	const name = mode.label ?? mode.name ?? 'unnamed mode'
	const location = await command.client.locations.get(locationId)

	console.log(`current mode for ${location.name} (${location.locationId}) set to ${name} (${mode.id})`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
