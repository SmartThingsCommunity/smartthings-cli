import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type Room } from '@smartthings/core-sdk'

import { type WithNamedLocation } from '../../lib/api-helpers.js'
import { fatalError } from '../../lib/util.js'
import { apiCommand, apiCommandBuilder, type APICommandFlags, apiDocsURL } from '../../lib/command/api-command.js'
import {
	outputItemOrList,
	outputItemOrListBuilder,
	type OutputItemOrListConfig,
	type OutputItemOrListFlags,
} from '../../lib/command/listing-io.js'
import { tableFieldDefinitions, tableFieldDefinitionsWithLocationName } from '../../lib/command/util/rooms-table.js'
import { getRoomsWithLocation } from '../../lib/command/util/rooms-util.js'


export type CommandArgs =
	& APICommandFlags
	& OutputItemOrListFlags
	& {
		location?: string
		verbose: boolean
		idOrIndex?: string
	}

const command = 'locations:rooms [id-or-index]'

const describe = 'list rooms or get information for a specific room'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemOrListBuilder(apiCommandBuilder(yargs))
		.positional('id-or-index', { describe: 'the room id or number in list', type: 'string' })
		.option('location', {
			alias: 'l',
			describe: 'a specific location to query',
			type: 'string',
		})
		.option('verbose',
			{ alias: 'v', describe: 'include location name in output', type: 'boolean', default: false })
		.example([
			['$0 locations:rooms', 'list all rooms'],
			[
				'$0 locations:rooms 1',
				'display details for the first room in the list retrieved by running "smartthings locations:rooms"',
			],
			['$0 locations:rooms 5dfd6626-ab1d-42da-bb76-90def3153998', 'display details for a room by id'],
		])
		.epilog(apiDocsURL('listRooms', 'getRoom'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const config: OutputItemOrListConfig<Room & WithNamedLocation> = {
		primaryKeyName: 'roomId',
		sortKeyName: 'name',
		listTableFieldDefinitions: tableFieldDefinitions,
		tableFieldDefinitions: tableFieldDefinitions,
	}
	if (argv.verbose) {
		config.listTableFieldDefinitions = tableFieldDefinitionsWithLocationName
		config.tableFieldDefinitions = tableFieldDefinitionsWithLocationName
	}
	const rooms = await getRoomsWithLocation(command.client, argv.location)
	await outputItemOrList<Room & WithNamedLocation>(
		command,
		config,
		argv.idOrIndex,
		async () => rooms,
		async id => {
			const room = rooms.find(room => room.roomId === id)
			if (!room) {
				return fatalError(`Could not find room with id ${id}.`)
			}
			return room
		})
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
