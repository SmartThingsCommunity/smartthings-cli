import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../../../lib/command/api-command.js'
import { edgeCommand } from '../../../lib/command/edge-command.js'
import {
	outputItemOrList,
	outputItemOrListBuilder,
	type OutputItemOrListConfig,
	type OutputItemOrListFlags,
} from '../../../lib/command/listing-io.js'
import { listTableFieldDefinitions, tableFieldDefinitions } from '../../../lib/command/util/edge-invites-table.js'
import { buildListFunction } from '../../../lib/command/util/edge-invites-util.js'
import { type Invitation } from '../../../lib/edge/endpoints/invites.js'


export type CommandArgs =
	& APICommandFlags
	& OutputItemOrListFlags
	& {
		channel?: string
		idOrIndex?: string
	}

const command = 'edge:channels:invites [id-or-index]'

const describe = 'list invitations or retrieve a single invitation by id or index'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemOrListBuilder(apiCommandBuilder(yargs))
		.positional('id-or-index', { describe: 'the invitation id or number in list', type: 'string' })
		.option('channel', {
			alias: 'C',
			describe: 'channel id',
			type: 'string',
		})
		.example([
			['$0 edge:channels:invites', 'list all invites on all channels you own'],
			[
				'$0 edge:channels:invites 2',
				'display details for the second invite in the list retrieved by running' +
					' "smartthings edge:channels:invites"',
			],
			[
				'$0 edge:channels:invites 5dfd6626-ab1d-42da-bb76-90def3153998',
				'display details for an invite by id',
			],
			[
				'$0 edge:channels:invites --channel 92ece7fc-46d0-4a6c-932c-f7c4a1b8d754',
				'list invites for the specified channel',
			],
		])

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = edgeCommand(await apiCommand(argv))

	const config: OutputItemOrListConfig<Invitation> = {
		primaryKeyName: 'id',
		sortKeyName: 'id',
		listTableFieldDefinitions,
		tableFieldDefinitions,
	}

	await outputItemOrList<Invitation>(
		command,
		config,
		argv.idOrIndex,
		buildListFunction(command, argv.channel),
		id => command.edgeClient.invites.get(id),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
