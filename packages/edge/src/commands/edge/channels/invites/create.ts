import { Flags } from '@oclif/core'
import inquirer from 'inquirer'

import { inputAndOutputItem, userInputProcessor } from '@smartthings/cli-lib'

import { chooseChannel } from '../../../../lib/commands/channels-util'
import { EdgeCommand } from '../../../../lib/edge-command'
import { CreateInvitation, Invitation } from '../../../../lib/endpoints/invites'


const tableFieldDefinitions = ['id', 'metadata.name', 'profileId', 'expiration', 'acceptUrl']

const defaultInvitationProfileId = '61a79569-e8fd-4a4d-9b9c-a4a55ccdd15e'

export default class ChannelsInvitesCreateCommand extends EdgeCommand<typeof ChannelsInvitesCreateCommand.flags> {
	static description = 'create an invitation'

	static flags = {
		channel: Flags.string({
			char: 'C',
			description: 'channel id',
			exclusive: ['input'],
			helpValue: '<UUID>',
		}),
		...EdgeCommand.flags,
		...inputAndOutputItem.flags,
	}

	static aliases = ['edge:channels:invitations:create']

	async run(): Promise<void> {
		const create = async (_: void, input: CreateInvitation): Promise<Invitation> => {
			const { invitationId } = await this.edgeClient.invites.create(input)
			const invitation = await this.edgeClient.invites.get(invitationId)
			return invitation
		}

		await inputAndOutputItem(this, { tableFieldDefinitions }, create, userInputProcessor(this))
	}

	async getInputFromUser(): Promise<CreateInvitation> {
		const channelId = await chooseChannel(this, 'Choose a channel:', this.flags.channel,
			{ useConfigDefault: true })

		const name = (await inquirer.prompt({
			type: 'input',
			name: 'name',
			message: 'Invitation name:',
			validate: input => input ? true : 'name is required',
		})).name as string

		const description = (await inquirer.prompt({
			type: 'input',
			name: 'description',
			message: 'Invitation description:',
			validate: input => input ? true : 'description is required',
		})).description as string

		const owner = (await inquirer.prompt({
			type: 'input',
			name: 'owner',
			message: 'Invitation owner:',
			validate: input => input ? true : 'owner is required',
		})).owner as string

		const termsUrl = (await inquirer.prompt({
			type: 'input',
			name: 'termsUrl',
			message: 'Invitation termsUrl:',
			validate: input => input ? true : 'termsUrl is required',
		})).termsUrl as string

		const profileId = (this.profile.defaultInvitationProfileId as string)
			?? defaultInvitationProfileId
		return {
			resource: {
				root: {
					service: 'developer',
				},
				components: [{
					id: channelId,
					kind: 'channel',
				}],
			},
			profileId,
			metadata: {
				name,
				description,
				owner,
				termsUrl,
			},
		}
	}
}
