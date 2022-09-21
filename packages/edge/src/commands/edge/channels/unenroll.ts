import { Flags } from '@oclif/core'

import { chooseChannel } from '../../../lib/commands/channels-util'
import { chooseHub } from '../../../lib/commands/drivers-util'
import { EdgeCommand } from '../../../lib/edge-command'


export class ChannelsUnenrollCommand extends EdgeCommand<typeof ChannelsUnenrollCommand.flags> {
	static description = 'unenroll a hub from a channel'

	static flags = {
		...EdgeCommand.flags,
		channel: Flags.string({
			char: 'C',
			description: 'channel id',
			helpValue: '<UUID>',
		}),
	}

	static args = [
		{
			name: 'hubId',
			description: 'hub id',
		},
	]

	async run(): Promise<void> {
		const channelId = await chooseChannel(this, 'Select a channel.', this.flags.channel,
			{ includeReadOnly: true })
		const hubId = await chooseHub(this, 'Select a hub.', this.args.hubId,
			{ useConfigDefault: true })

		await this.client.channels.unenrollHub(channelId, hubId)

		this.log(`${hubId} unenrolled from channel ${channelId}`)
	}
}
