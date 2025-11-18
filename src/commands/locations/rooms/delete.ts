import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { buildEpilog } from '../../../lib/help.js'
import {
	type APICommandFlags,
	apiCommand,
	apiCommandBuilder,
} from '../../../lib/command/api-command.js'
import { chooseRoom } from '../../../lib/command/util/rooms-choose.js'


export type CommandArgs = APICommandFlags & {
	location?: string
	id?: string
}

export const command = 'locations:rooms:delete [id]'

const describe = 'delete a room'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiCommandBuilder(yargs)
		.option('location', { alias: 'l', describe: 'filter rooms by location', type: 'string' })
		.positional('id', { describe: 'room id', type: 'string' })
		.example([
			['$0 rooms:delete', 'choose the room to delete from a list'],
			[
				'$0 rooms:delete 43daec4d-f2c6-4bc3-9df7-50ed1012c137',
				'delete the room with the specified id',
			],
			[
				'$0 rooms:delete -l 8c39c0ac-0e6e-405e-a835-a2afd86aeaf0',
				'choose the room to delete from a list of rooms in the specified location',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'deleteRoom' }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const [roomId, locationId] = await chooseRoom(command, argv.id, { locationId: argv.location })
	await command.client.rooms.delete(roomId, locationId)
	console.log(`Room ${roomId} deleted.`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
