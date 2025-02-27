import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { Channel, SubscriberType } from '@smartthings/core-sdk'

import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../lib/command/api-organization-command.js'
import {
	allOrganizationsBuilder,
	type AllOrganizationFlags,
} from '../../lib/command/common-flags.js'
import {
	outputItemOrList,
	outputItemOrListBuilder,
	type OutputItemOrListConfig,
	type OutputItemOrListFlags,
} from '../../lib/command/listing-io.js'
import { apiDocsURL } from '../../lib/command/api-command.js'
import { WithOrganization } from '../../lib/api-helpers.js'
import { listTableFieldDefinitions, tableFieldDefinitions } from '../../lib/command/util/edge/channels-table.js'
import { listChannels } from '../../lib/command/util/edge/channels.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& AllOrganizationFlags
	& OutputItemOrListFlags & {
		includeReadOnly?: boolean
		subscriberType?: string
		subscriberId?: string
		idOrIndex?: string
	}

const command = 'edge:channels [id-or-index]'

const describe = 'list all channels owned by you or retrieve a single channel'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemOrListBuilder(allOrganizationsBuilder(apiOrganizationCommandBuilder(yargs)))
		.option(
			'include-read-only',
			{
				alias: 'I',
				describe: 'include subscribed-to channels as well as owned channels',
				type: 'boolean',
				default: false,
			})
		.option(
			'subscriber-type',
			{
				describe: 'filter results based on subscriber type',
				type: 'string',
				choices: ['HUB'],
				coerce: arg => arg?.toUpperCase(),
			})
		.option(
			'subscriber-id',
			{
				describe: 'filter results based on subscriber id (e.g. hub id)',
				type: 'string',
			})
		.positional(
			'id-or-index',
			{ describe: 'the channel id or number in list', type: 'string' },
		)
		.positional('driver-version', { describe: 'driver version', type: 'string' })
		.example([
			['$0 edge:channels', 'list all channels you own'],
			['$0 edge:channels --include-read-only', 'list user-owned and subscribed channels'],
			['$0 edge:channels 699c7308-8c72-4363-9571-880d0f5cc725', 'display details for a driver by id'],
			[
				'$0 edge:channels 2',
				'display details about the second channel listed when running "smartthings edge:channels"',
			],
			[
				'$0 edge:channels --subscriber-type HUB --subscriber-id <hub-id>',
				'display channels subscribed to by the specified hub',
			],
		])
		.epilog(
			'Use this command to list all drivers you own, even if they are not yet assigned to' +
			' a channel.\n\n' +
			'See also drivers:installed to list installed drivers and channels:drivers to list' +
			' drivers that are part of a channel you own or have subscribed to.\n\n' +
			apiDocsURL('listChannels', 'channelById'),
		)

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const config: OutputItemOrListConfig<Channel & WithOrganization> = {
		primaryKeyName: 'channelId',
		sortKeyName: 'name',
		listTableFieldDefinitions,
		tableFieldDefinitions,
	}
	if (argv.allOrganizations) {
		config.listTableFieldDefinitions = [...listTableFieldDefinitions, 'organization']
	}

	const subscriberType = (argv.subscriberType as SubscriberType | undefined)
		?? (argv.subscriberId ? 'HUB' : undefined)
	await outputItemOrList<Channel & WithOrganization>(
		command,
		config,
		argv.idOrIndex,
		async () => listChannels(
			command.client,
			{
				allOrganizations: argv.allOrganizations,
				subscriberType,
				subscriberId: argv.subscriberId,
				includeReadOnly: argv.includeReadOnly,
			},
		),
		id => command.client.channels.get(id),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
