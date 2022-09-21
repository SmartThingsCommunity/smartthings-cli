import { EdgeCommand } from '../../../../lib/edge-command'


export default class ChannelsInvitesAcceptCommand extends EdgeCommand<typeof ChannelsInvitesAcceptCommand.flags> {
	static description = 'accept a channel invitation'

	static flags = EdgeCommand.flags

	static args = [{
		name: 'id',
		description: 'invite UUID',
		required: true,
	}]

	static aliases = ['edge:channels:invitations:accept']

	async run(): Promise<void> {
		const id = this.args.id
		await this.edgeClient.invites.accept(id)
		this.log(`Invitation ${id} accepted.`)
	}
}
