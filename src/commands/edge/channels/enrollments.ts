import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import type { EnrolledChannel } from '@smartthings/core-sdk'

import { apiCommand, apiCommandBuilder, apiDocsURL, type APICommandFlags } from '../../../lib/command/api-command.js'
import {
	outputList,
	outputListBuilder,
	type OutputListConfig,
	type OutputListFlags,
} from '../../../lib/command/output-list.js'
import { chooseHub } from '../../../lib/command/util/hubs-choose.js'


export type CommandArgs =
	& APICommandFlags
	& OutputListFlags
	& {
		idOrIndex?: string
	}

const command = 'edge:channels:enrollments [id-or-index]'

const describe = 'list all channels a given hub is enrolled in'


const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputListBuilder(apiCommandBuilder(yargs))
		.positional('id-or-index', { describe: 'hub id or number in list', type: 'string' })
		.example([
			[
				'$0 edge:channels:enrollments',
				'prompt for a hub (or use default) and display channels it is enrolled in',
			],
			[
				'$0 edge:channels:enrollments 86042494-ae59-43a8-bc09-654103b5c5b3',
				'display channels the specified hub is enrolled in',
			],
		])
		.epilog(apiDocsURL('listDriverChannels'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const config: OutputListConfig<EnrolledChannel> = {
		primaryKeyName: 'channelId',
		sortKeyName: 'name',
		listTableFieldDefinitions: [
			'channelId',
			'name',
			'description',
			'createdDate',
			'lastModifiedDate',
			'subscriptionUrl',
		],
	}

	const hubId = await chooseHub(
		command,
		argv.idOrIndex,
		{ allowIndex: true, useConfigDefault: true },
	)

	await outputList(command, config, () => command.client.hubdevices.enrolledChannels(hubId))
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
