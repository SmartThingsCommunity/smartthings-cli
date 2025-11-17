import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type Room, type RoomRequest } from '@smartthings/core-sdk'

import { buildEpilog } from '../../../lib/help.js'
import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../../../lib/command/api-command.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemConfig,
	type InputAndOutputItemFlags,
} from '../../../lib/command/input-and-output-item.js'
import { chooseLocation } from '../../../lib/command/util/locations-util.js'
import { tableFieldDefinitions } from '../../../lib/command/util/rooms-table.js'


export type CommandArgs =
	& APICommandFlags
	& InputAndOutputItemFlags
	& {
		location?: string
	}

const command = 'locations:rooms:create'

const describe = 'create a room'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiCommandBuilder(yargs))
		.option('location', {
			alias: 'l',
			describe: 'the location for the new room',
			type: 'string',
		})
		.example([
			[
				'$0 locations:rooms:create -i room-info.json',
				'create a room with the data in "room-info.json", prompting for a location',
			],
			[
				'$0 locations:rooms:create -i room-info.json --location 1e10b966-1d38-4996-bdcd-3ebd1d9dadcd',
				'create a room in the specified location with the data in "room-info.json"',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'createRoom' }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const locationId = await chooseLocation(command, argv.location)
	const config: InputAndOutputItemConfig<Room> = { tableFieldDefinitions }
	await inputAndOutputItem<RoomRequest, Room>(
		command,
		config,
		(_, room) => command.client.rooms.create(room, locationId),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
