import { Flags } from '@oclif/core'

import { Device } from '@smartthings/core-sdk'

import { chooseChannel } from '../../../lib/commands/channels-util.js'
import { chooseHub, listOwnedHubs } from '../../../lib/commands/drivers-util.js'
import { EdgeCommand } from '../../../lib/edge-command.js'


export const maxHubsToCheckForEnrollments = 15

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

	static examples = [
		{
			description: 'prompt user for hub and channel and then unenroll hub from channel',
			command: 'smartthings edge:channels:unenroll',
		},
		{
			description: 'prompt user for a channel the given hub is enrolled in and then unenroll it',
			command: 'smartthings edge:channels:unenroll 2fa0912f-cb73-424e-97f9-ffff76ea4f2a',
		},
		{
			description: 'unenroll the specified hub from the specified channel',
			command: 'smartthings edge:channels:unenroll 2fa0912f-cb73-424e-97f9-ffff76ea4f2a --channel fcd6ca9c-2764-4dbb-9bbe-d40c900c960f',
		},
	]

	async run(): Promise<void> {
		// A special listItems for `chooseHub` that will only include hubs which are enrolled in channels.
		const listItems = async (): Promise<Device[]> => {
			const hubs = await listOwnedHubs(this)
			const hubsWithChannels = await Promise.all(hubs.map(async hub =>
				({ hub, channels: await this.client.hubdevices.enrolledChannels(hub.deviceId) })))
			return hubsWithChannels
				.flat()
				.filter(({ channels }) => channels.length > 0)
				.map(({ hub }) => hub)
		}
		const hubId = await chooseHub(this, 'Select a hub.', this.args.hubId,
			{ useConfigDefault: true, listItems })

		const channelId = await chooseChannel(this, 'Select a channel.', this.flags.channel,
			{ includeReadOnly: true, listItems: () => this.client.hubdevices.enrolledChannels(hubId) })

		await this.client.channels.unenrollHub(channelId, hubId)

		this.log(`${hubId} unenrolled from channel ${channelId}`)
	}
}
