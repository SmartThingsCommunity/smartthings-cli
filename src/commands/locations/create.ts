import { ArgumentsCamelCase, Argv, CommandModule } from 'yargs'

import { LocationCreate } from '@smartthings/core-sdk'

import { tableFieldDefinitions } from '../../lib/command/util/locations-util.js'
import { APICommandFlags, apiCommand, apiCommandBuilder, apiDocsURL } from '../../lib/command/api-command.js'
import { InputAndOutputItemFlags, inputAndOutputItem, inputAndOutputItemBuilder } from '../../lib/command/basic-io.js'


export type CommandArgs = APICommandFlags & InputAndOutputItemFlags

export const command = 'locations:create'

const describe = 'create a Location for a user'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiCommandBuilder(yargs))
		.example([
			['$0 locations:create -i my-location.yaml', 'create a location defined in my-location.yaml'],
		])
		.epilog(apiDocsURL('createLocation'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	await inputAndOutputItem(command, { tableFieldDefinitions },
		(_, input: LocationCreate) => command.client.locations.create(input))
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
