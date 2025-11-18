import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { buildEpilog } from '../../../lib/help.js'
import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../../../lib/command/api-command.js'
import { chooseChannelFn } from '../../../lib/command/util/edge/channels-choose.js'
import { chooseHub } from '../../../lib/command/util/hubs-choose.js'


export type CommandArgs =
	& APICommandFlags
	& {
		hubId?: string
		channel?: string
	}

const command = 'edge:channels:enroll [hub-id]'

const describe = 'enroll a hub in a channel'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiCommandBuilder(yargs)
		.positional('id', { describe: 'hub id', type: 'string' })
		.option('channel', { alias: 'C', describe: 'channel id', type: 'string' })
		.example([
			['$0 edge:channels:enroll', 'prompt for channel and hub'],
			[
				'$0 edge:channels:enroll 8bbc88c2-8e59-4cad-ade2-b57021a2dbfd' +
					' --channel b1a462c1-f63b-442c-8db9-4af7da31f187',
				'enroll the specified hub in the specified channel',
			],
		])
		.epilog(buildEpilog({ command }))


const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const channelId = await chooseChannelFn({ includeReadOnly: true })( command, argv.channel )
	const hubId = await chooseHub(command, argv.hubId, { useConfigDefault: true })

	await command.client.channels.enrollHub(channelId, hubId)

	console.log(`${hubId} enrolled in channel ${channelId}`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
