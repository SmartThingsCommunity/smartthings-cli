import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type Mode, type ModeRequest } from '@smartthings/core-sdk'

import { buildEpilog } from '../../../lib/help.js'
import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../../../lib/command/api-command.js'
import { CommonOutputProducer } from '../../../lib/command/format.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemFlags,
} from '../../../lib/command/input-and-output-item.js'
import { chooseLocation } from '../../../lib/command/util/locations-util.js'
import { tableFieldDefinitions } from '../../../lib/command/util/modes-table.js'


export type CommandArgs =
	& APICommandFlags
	& InputAndOutputItemFlags
	& {
		location?: string
	}

const command = 'locations:modes:create'

const describe = 'create a mode'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiCommandBuilder(yargs))
		.option('location', { alias: 'l', describe: 'a specific location to create the mode in', type: 'string' })
		.example([
			[
				'$0 locations:modes:create --input new-mode.json',
				'create a new mode as defined in new-mode.json, prompting for a location',
			],
			[
				'$0 locations:modes:create --location 5dfd6626-ab1d-42da-bb76-90def3153998 --input=new-mode.json',
				'create a new mode in the specified location as defined in new-mode.json',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'createMode' }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const locationId = await chooseLocation(command, argv.location)
	const config: CommonOutputProducer<Mode> = { tableFieldDefinitions }
	await inputAndOutputItem<ModeRequest, Mode>(
		command,
		config,
		(_, mode) => command.client.modes.create(mode, locationId),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
