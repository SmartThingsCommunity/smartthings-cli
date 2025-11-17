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
import { chooseMode } from '../../../lib/command/util/modes-choose.js'
import { tableFieldDefinitions } from '../../../lib/command/util/modes-table.js'


export type CommandArgs =
	& APICommandFlags
	& InputAndOutputItemFlags
	& {
		location?: string
		id?: string
	}

const command = 'locations:modes:update [id]'

const describe = "update a mode's label"

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiCommandBuilder(yargs))
		.positional('id', { describe: 'mode id', type: 'string' })
		.option('location', { alias: 'l', describe: 'a specific location to query', type: 'string' })
		.example([
			[
				'$0 locations:modes:update --input mode.json',
				'select a mode from a list of all modes and update it using the data in mode.json',
			],
			[
				'$0 locations:modes:update --location 5dfd6626-ab1d-42da-bb76-90def3153998 --input mode.yaml',
				'select a mode from a list of modes in a specified location and update it using the data in mode.yaml',
			],
			[
				'$0 locations:modes:update 636169e4-8b9f-4438-a941-953b0d617231 --input mode.json',
				'update a specified mode using the data in mode.json',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'updateMode' }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const [modeId, locationId] = await chooseMode(command, argv.id, { locationId: argv.location })
	const config: CommonOutputProducer<Mode> = { tableFieldDefinitions }
	await inputAndOutputItem<ModeRequest, Mode>(
		command,
		config,
		(_, data) => command.client.modes.update(modeId, data, locationId),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
