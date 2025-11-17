import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type Location, type LocationUpdate } from '@smartthings/core-sdk'

import { buildEpilog } from '../../lib/help.js'
import { chooseLocation, tableFieldDefinitions } from '../../lib/command/util/locations-util.js'
import {
	type APICommandFlags,
	apiCommand,
	apiCommandBuilder,
} from '../../lib/command/api-command.js'
import {
	type InputAndOutputItemFlags,
	inputAndOutputItem,
	inputAndOutputItemBuilder,
} from '../../lib/command/input-and-output-item.js'


export type CommandArgs = APICommandFlags & InputAndOutputItemFlags & {
	id?: string
}

const command = 'locations:update [id]'

const describe = 'update a location'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiCommandBuilder(yargs))
		.positional('id', { describe: 'location id', type: 'string' })
		.example([
			[
				'$0 locations:update -i my-location.yaml',
				'prompt for a location and update it using the data in "my-location.yaml"',
			],
			[
				'$0 locations:update 392bcb11-e251-44f3-b58b-17f93015f3aa -i my-location.json',
				'update the location with the given id using the data in "my-location.json"',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'updateLocation' }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const id = await chooseLocation(command, argv.id)
	await inputAndOutputItem<LocationUpdate, Location>(command, { tableFieldDefinitions },
		(_, location) => command.client.locations.update(id, location))
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
