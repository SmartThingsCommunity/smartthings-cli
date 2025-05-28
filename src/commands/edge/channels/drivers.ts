import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { apiCommand, apiCommandBuilder, apiDocsURL, type APICommandFlags } from '../../../lib/command/api-command.js'
import {
	outputList,
	outputListBuilder,
	type OutputListConfig,
	type OutputListFlags,
} from '../../../lib/command/output-list.js'
import {
	type DriverChannelDetailsWithName,
	listAssignedDriversWithNames,
} from '../../../lib/command/util/edge-drivers.js'
import { chooseChannel } from '../../../lib/command/util/edge/channels-choose.js'


export type CommandArgs =
	& APICommandFlags
	& OutputListFlags
	& {
		idOrIndex?: string
	}

const command = 'edge:channels:drivers [id-or-index]'

const describe = 'list drivers assigned to a given channel'


const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputListBuilder(apiCommandBuilder(yargs))
		.positional('id-or-index', { describe: 'channel id or number in list', type: 'string' })
		.example([
			[
				'$0 edge:channels:drivers',
				'prompt for a channel and display drivers assigned to it',
			],
			[
				'$0 edge:channels:drivers 5491f7e6-8140-415c-9158-a3eec1cb583d',
				'display drivers assigned to the specified channel',
			],
		])
		.epilog(apiDocsURL('getChannelDrivers', 'getDriverChannel'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const config: OutputListConfig<DriverChannelDetailsWithName> = {
		primaryKeyName: 'channelId',
		sortKeyName: 'name',
		listTableFieldDefinitions: ['name', 'driverId', 'version', 'createdDate', 'lastModifiedDate'],
	}

	const channelId = await chooseChannel(
		command,
		'Select a channel.',
		argv.idOrIndex,
		{ allowIndex: true, includeReadOnly: true, useConfigDefault: true },
	)

	await outputList(command, config, () => listAssignedDriversWithNames(command.client, channelId))
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
