import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type Room, type RoomRequest } from '@smartthings/core-sdk'

import { apiCommand, apiCommandBuilder, apiDocsURL, type APICommandFlags } from '../../../lib/command/api-command.js'
import { type CommonOutputProducer } from '../../../lib/command/format.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemFlags,
} from '../../../lib/command/input-and-output-item.js'
import { chooseRoom } from '../../../lib/command/util/rooms-choose.js'
import { tableFieldDefinitions } from '../../../lib/command/util/rooms-table.js'


export type CommandArgs =
	& APICommandFlags
	& InputAndOutputItemFlags
	& {
		location?: string
		id?: string
	}

const command = 'locations:rooms:update [id]'

const describe = 'update a room'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiCommandBuilder(yargs))
		.positional('id', { describe: 'room id', type: 'string' })
		.option('location', { alias: 'l', describe: 'a specific location to query', type: 'string' })
		.example([
			[
				'$0 locations:rooms:update -i my-room.json',
				'prompt for a room and update it using the data in "my-room.json"',
			],
			[
				'$0 locations:rooms:update 392bcb11-e251-44f3-b58b-17f93015f3aa -i my-room.json',
				'update the room with the given id using the data in "my-room.json"',
			],
		])
		.epilog(apiDocsURL('updateRoom'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const [roomId, locationId] = await chooseRoom(command, argv.id, { locationId: argv.location })
	const config: CommonOutputProducer<Room> = { tableFieldDefinitions }
	await inputAndOutputItem<RoomRequest, Room>(
		command,
		config,
		(_, data) => command.client.rooms.update(roomId, data, locationId),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
