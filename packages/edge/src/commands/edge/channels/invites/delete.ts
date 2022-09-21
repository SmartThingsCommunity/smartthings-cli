import { Flags } from '@oclif/core'

import { chooseChannel } from '../../../../lib/commands/channels-util'
import { EdgeCommand } from '../../../../lib/edge-command'
import { chooseInvite } from '../invites'


export default class ChannelsInvitesDeleteCommand extends EdgeCommand<typeof ChannelsInvitesDeleteCommand.flags> {
	static description = 'delete a channel invitation'

	static flags = {
		...EdgeCommand.flags,
		channel: Flags.string({
			char: 'C',
			description: 'channel id',
			helpValue: '<UUID>',
		}),
	}

	static args = [{
		name: 'id',
		description: 'invitation UUID',
	}]

	static aliases = [
		'edge:channels:invitations:revoke',
		'edge:channels:invitations:delete',
		'edge:channels:invites:revoke',
	]

	async run(): Promise<void> {
		const channelId = await chooseChannel(this,
			'Which channel is the invite you want to delete for?',
			this.flags.channel, { useConfigDefault: true })

		const id = await chooseInvite(this, 'Choose an invitation to delete.', channelId, this.args.id)
		await this.edgeClient.invites.delete(id)
		this.log(`Invitation ${id} deleted.`)
	}
}
