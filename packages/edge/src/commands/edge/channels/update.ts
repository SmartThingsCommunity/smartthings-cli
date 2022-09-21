import { inputAndOutputItem } from '@smartthings/cli-lib'

import { Channel, ChannelUpdate } from '@smartthings/core-sdk'

import { chooseChannel, tableFieldDefinitions } from '../../../lib/commands/channels-util'
import { EdgeCommand } from '../../../lib/edge-command'


export default class ChannelsUpdateCommand extends EdgeCommand<typeof ChannelsUpdateCommand.flags> {
	static description = 'update a channel'

	static flags = {
		...EdgeCommand.flags,
		...inputAndOutputItem.flags,
	}

	static args = [{
		name: 'id',
		description: 'the channel id',
	}]

	async run(): Promise<void> {
		const id = await chooseChannel(this, 'Choose a channel to patch.', this.args.id,
			{ useConfigDefault: true })
		await inputAndOutputItem<ChannelUpdate, Channel>(this, { tableFieldDefinitions },
			(_, channelMods) => this.client.channels.update(id, channelMods))
	}
}
