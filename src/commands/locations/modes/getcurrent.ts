import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type Mode } from '@smartthings/core-sdk'

import { withLocation, type WithNamedLocation } from '../../../lib/api-helpers.js'
import { apiCommand, apiCommandBuilder, type APICommandFlags, apiDocsURL } from '../../../lib/command/api-command.js'
import {
	formatAndWriteItem,
	formatAndWriteItemBuilder,
	type FormatAndWriteItemConfig,
	type FormatAndWriteItemFlags,
} from '../../../lib/command/format.js'
import { chooseLocation } from '../../../lib/command/util/locations-util.js'
import { tableFieldDefinitions, tableFieldDefinitionsWithLocationName } from '../../../lib/command/util/modes-table.js'


export type CommandArgs =
	& APICommandFlags
	& FormatAndWriteItemFlags
	& {
		location?: string
		id?: string
		verbose: boolean
	}

const command = 'locations:modes:getcurrent [id]'

const describe = 'get details of current mode'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	formatAndWriteItemBuilder(apiCommandBuilder(yargs))
		.positional('id', { describe: 'mode id', type: 'string' })
		.option('location', { alias: 'l', describe: 'a specific location to query', type: 'string' })
		.option('verbose',
			{ alias: 'v', describe: 'include location name in output', type: 'boolean', default: false })
		.example([
			[
				'$0 locations:modes:getcurrent',
				'get details of current mode, prompting for a location if there are more than one',
			],
			[
				'$0 locations:modes:getcurrent --verbose',
				'include location name and id in the output',
			],
			[
				'$0 locations:modes:getcurrent --location 5dfd6626-ab1d-42da-bb76-90def3153998',
				'get the current mode for a specified location',
			],
		])
		.epilog(apiDocsURL('getCurrentMode'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const config: FormatAndWriteItemConfig<Mode & WithNamedLocation> = {
		tableFieldDefinitions,
	}
	if (argv.verbose) {
		config.tableFieldDefinitions = tableFieldDefinitionsWithLocationName
	}
	const locationId = await chooseLocation(command, argv.location, { autoChoose: true })
	const currentMode = await command.client.modes.getCurrent(locationId)
	const mode = argv.verbose ? await withLocation(command.client, { ...currentMode, locationId }) : currentMode
	await formatAndWriteItem(command, config, mode)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
