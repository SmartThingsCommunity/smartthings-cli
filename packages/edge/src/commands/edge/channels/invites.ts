import { Flags } from '@oclif/core'

import {
	ChooseOptions,
	chooseOptionsWithDefaults,
	outputItemOrList,
	OutputItemOrListConfig,
	selectFromList,
	SelectFromListConfig,
	stringTranslateToId,
	TableFieldDefinition,
} from '@smartthings/cli-lib'

import { EdgeCommand } from '../../../lib/edge-command'
import { Invitation } from '../../../lib/endpoints/invites'


export const listTableFieldDefinitions: TableFieldDefinition<Invitation>[] = [
	'id',
	'metadata.name',
	{ label: 'Channel Id', prop: 'resource.components[0].id' },
	{
		label: 'Expiration',
		value: ({ expiration }) => expiration ? new Date(expiration * 1000).toISOString() : '',
	},
	'acceptUrl',
]
export const tableFieldDefinitions = [
	...listTableFieldDefinitions,
	'profileId',
]

const buildListFunction = (command: EdgeCommand<typeof EdgeCommand.flags>, channelId?: string) => async (): Promise<Invitation[]> => {
	const channelIds = channelId
		? [channelId]
		: (await command.client.channels.list()).map(channel => channel.channelId)
	return (await Promise.all(channelIds.map(async channelId => await command.edgeClient.invites.list(channelId)))).flat()
}

export async function chooseInvite(command: EdgeCommand<typeof EdgeCommand.flags>, promptMessage: string, channelId?: string, inviteFromArg?: string, options?: Partial<ChooseOptions>): Promise<string> {
	const opts = chooseOptionsWithDefaults(options)
	const config: SelectFromListConfig<Invitation> = {
		itemName: 'invitation',
		primaryKeyName: 'id',
		sortKeyName: 'id', // only supports simple properties so we can't sort by metadata.name even though we can use that in the table
		listTableFieldDefinitions: ['id', 'metadata.name'],
	}
	const listItems = buildListFunction(command, channelId)
	const preselectedId = opts.allowIndex
		? await stringTranslateToId(config, inviteFromArg, listItems)
		: inviteFromArg
	return selectFromList(command, config, { preselectedId, listItems, promptMessage })
}


export default class ChannelsInvitesCommand extends EdgeCommand<typeof ChannelsInvitesCommand.flags> {
	static description = 'list invitations or retrieve a single invitation by id or index'

	static flags = {
		...EdgeCommand.flags,
		...outputItemOrList.flags,
		channel: Flags.string({
			char: 'C',
			description: 'channel id',
			helpValue: '<UUID>',
		}),
	}

	static args = [{
		name: 'idOrIndex',
		description: 'the invitation id or number in list',
	}]

	static aliases = ['edge:channels:invitations']

	static examples = [
		'smartthings edge:channels:invites                  # list all invites on all channels you own',
		'smartthings edge:channels:invites 2                # list details about the second invite show when listed as in the example above',
		'smartthings edge:channels:invites -C <channel id>  # list all invites on channel with id <channel id>',
		'smartthings edge:channels:invites <invite id>      # list details about the invite with id <invite id>',
	]

	async run(): Promise<void> {
		const config: OutputItemOrListConfig<Invitation> = {
			primaryKeyName: 'id',
			sortKeyName: 'id',
			listTableFieldDefinitions,
			tableFieldDefinitions,
		}

		await outputItemOrList<Invitation, Invitation>(this, config, this.args.idOrIndex,
			buildListFunction(this, this.flags.channel),
			id => this.edgeClient.invites.get(id))
	}
}
