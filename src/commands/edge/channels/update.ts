import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type Channel, type ChannelUpdate } from '@smartthings/core-sdk'

import { buildEpilog } from '../../../lib/help.js'
import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../../../lib/command/api-command.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemFlags,
} from '../../../lib/command/input-and-output-item.js'
import { chooseChannel } from '../../../lib/command/util/edge/channels-choose.js'
import { tableFieldDefinitions } from '../../../lib/command/util/edge/channels-table.js'


export type CommandArgs =
	& APICommandFlags
	& InputAndOutputItemFlags
	& {
		id?: string
	}

const command = 'edge:channels:update [id]'

const describe = 'update a channel'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiCommandBuilder(yargs))
		.positional('id', { describe: 'id of channel to update', type: 'string' })
		.example([
			[
				'$0 edge:channels:update --input channel.yaml',
				'prompt for a channel and update it using the data in channel.yaml',
			],
			[
				'$0 edge:channels:update 0068b912-50fb-439d-a14a-27cc90ca81dc --input channel.json',
				'update the specified channel using the data in channel.json',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'updateChannel' }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const id = await chooseChannel(
		command,
		argv.id,
		{ promptMessage: 'Choose a channel to update.', useConfigDefault: true },
	)
	await inputAndOutputItem<ChannelUpdate, Channel>(
		command,
		{ tableFieldDefinitions },
		(_, channelMods) => command.client.channels.update(id, channelMods),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
