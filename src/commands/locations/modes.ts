import { type Mode } from '@smartthings/core-sdk'

import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type WithNamedLocation } from '../../lib/api-helpers.js'
import { fatalError } from '../../lib/util.js'
import { apiCommand, apiCommandBuilder, type APICommandFlags, apiDocsURL } from '../../lib/command/api-command.js'
import {
	outputItemOrList,
	outputItemOrListBuilder,
	type OutputItemOrListConfig,
	type OutputItemOrListFlags,
} from '../../lib/command/listing-io.js'
import { getModesWithLocation } from '../../lib/command/util/modes.js'
import { tableFieldDefinitions, tableFieldDefinitionsWithLocationName } from '../../lib/command/util/modes-table.js'


export type CommandArgs =
	& APICommandFlags
	& OutputItemOrListFlags
	& {
		location?: string
		verbose: boolean
		idOrIndex?: string
	}

const command = 'locations:modes [id-or-index]'

const describe = 'list modes or get information for a specific mode'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemOrListBuilder(apiCommandBuilder(yargs))
		.positional('id-or-index', { describe: 'the mode id or number in list', type: 'string' })
		.option('location', {
			alias: 'l',
			describe: 'a specific location to query',
			type: 'string',
		})
		.option('verbose',
			{ alias: 'v', describe: 'include location name in output', type: 'boolean', default: false })
		.example([
			['$0 locations:modes', 'list all modes in your location(s)'],
			[
				'$0 locations:modes 3',
				'display details of the third mode in the list retrieved by running "smartthings locations:modes"',
			],
			['$0 locations:modes 636169e4-8b9f-4438-a941-953b0d617231', 'display details of a mode by its id'],
			['$0 locations:modes --verbose', 'include location info in the output'],
			['$0 locations:modes --location=5dfd6626-ab1d-42da-bb76-90def3153998', 'list all modes in a particular location'],
		])
		.epilog(apiDocsURL('getModes', 'getMode'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const config: OutputItemOrListConfig<Mode & WithNamedLocation> = {
		primaryKeyName: 'id',
		sortKeyName: 'label',
		listTableFieldDefinitions: tableFieldDefinitions,
		tableFieldDefinitions: tableFieldDefinitions,
	}
	if (argv.verbose) {
		config.listTableFieldDefinitions = tableFieldDefinitionsWithLocationName
		config.tableFieldDefinitions = tableFieldDefinitionsWithLocationName
	}
	const modes = await getModesWithLocation(command.client, argv.location)
	await outputItemOrList<Mode & WithNamedLocation>(
		command,
		config,
		argv.idOrIndex,
		async () => modes,
		async id => {
			const mode = modes.find(mode => mode.id === id)
			if (!mode) {
				return fatalError(`could not find mode with id ${id}`)
			}
			if (argv.verbose) {
				return mode
			}
			// If we aren't using `verbose` flag, get the raw mode again
			// so there aren't extra fields in JSON/YAML output
			return command.client.modes.get(id, mode.locationId)
		})
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
