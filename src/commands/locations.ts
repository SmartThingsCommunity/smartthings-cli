import { ArgumentsCamelCase, Argv, CommandModule } from 'yargs'

import { Location, LocationItem } from '@smartthings/core-sdk'

import { APICommandFlags, apiCommand, apiCommandBuilder, apiDocsURL } from '../lib/command/api-command.js'
import { OutputItemOrListConfig, OutputItemOrListFlags, outputItemOrList, outputItemOrListBuilder } from '../lib/command/listing-io.js'
import { tableFieldDefinitions } from '../lib/command/util/locations-util.js'


export type CommandArgs = APICommandFlags & OutputItemOrListFlags & {
	idOrIndex?: string
}


const command = 'locations [id-or-index]'

const describe = 'list locations or get information for a specific Location'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemOrListBuilder(apiCommandBuilder(yargs))
		.positional('id-or-index', { describe: 'the location id or number in list', type: 'string' })
		.example([
			['$0 locations', 'list all locations'],
			['$0 locations 1', 'display details for the first location in the list retrieved by running "smartthings locations"'],
			['$0 locations 5dfd6626-ab1d-42da-bb76-90def3153998', 'display details for a location by id'],
		])
		.epilog(apiDocsURL('listLocations', 'getLocation'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)
	const config: OutputItemOrListConfig<Location, LocationItem> = {
		primaryKeyName: 'locationId',
		sortKeyName: 'name',
		tableFieldDefinitions,
	}
	await outputItemOrList<Location, LocationItem>(
		command,
		config,
		argv.idOrIndex,
		() => command.client.locations.list(),
		id => command.client.locations.get(id),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
