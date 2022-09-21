import { Flags } from '@oclif/core'

import { Channel, SubscriberType } from '@smartthings/core-sdk'

import { allOrganizationsFlags, outputItemOrList, OutputItemOrListConfig } from '@smartthings/cli-lib'

import { EdgeCommand } from '../../lib/edge-command'
import { listChannels, listTableFieldDefinitions, tableFieldDefinitions } from '../../lib/commands/channels-util'


export default class ChannelsCommand extends EdgeCommand<typeof ChannelsCommand.flags> {
	static description = 'list all channels owned by you or retrieve a single channel'

	/* eslint-disable @typescript-eslint/naming-convention */
	static flags = {
		...EdgeCommand.flags,
		...outputItemOrList.flags,
		...allOrganizationsFlags,
		'include-read-only': Flags.boolean({
			char: 'I',
			description: 'include subscribed-to channels as well as owned channels',
			exclusive: ['all-organizations'],
		}),
		'subscriber-type': Flags.string({
			description: 'filter results based on subscriber type',
			options: ['HUB'],
		}),
		'subscriber-id': Flags.string({
			description: 'filter results based on subscriber id (e.g. hub id)',
			dependsOn: ['subscriber-type'],
			helpValue: '<UUID>',
		}),
	}
	/* eslint-enable @typescript-eslint/naming-convention */

	static args = [{
		name: 'idOrIndex',
		description: 'the channel id or number in list',
	}]

	static examples = [`# list all user-owned channels
$ smartthings edge:channels

# list user-owned and subscribed channels
$ smartthings edge:channels --include-read-only`,
	`
# display details about the second channel listed when running "smartthings edge:channels"
$ smartthings edge:channels 2

# display channels subscribed to by the specified hub
$ smartthings edge:channels --subscriber-type HUB --subscriber-id <hub-id>`]

	async run(): Promise<void> {
		const config: OutputItemOrListConfig<Channel> = {
			primaryKeyName: 'channelId',
			sortKeyName: 'name',
			listTableFieldDefinitions,
			tableFieldDefinitions,
		}
		if (this.flags['all-organizations']) {
			config.listTableFieldDefinitions.push('organization')
		}

		await outputItemOrList(this, config, this.args.idOrIndex,
			async () => listChannels(this.client, {
				subscriberType: this.flags['subscriber-type'] as SubscriberType | undefined,
				subscriberId: this.flags['subscriber-id'],
				includeReadOnly: this.flags['include-read-only'],
			}),
			id => this.client.channels.get(id))
	}
}
