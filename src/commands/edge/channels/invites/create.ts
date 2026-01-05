import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type TableFieldDefinition } from '../../../../lib/table-generator.js'
import { stringInput } from '../../../../lib/user-query.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../../../lib/command/api-organization-command.js'
import { edgeCommand } from '../../../../lib/command/edge-command.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemFlags,
} from '../../../../lib/command/input-and-output-item.js'
import { userInputProcessor } from '../../../../lib/command/input-processor.js'
import { chooseChannel } from '../../../../lib/command/util/edge/channels-choose.js'
import { type Invitation, type InvitationCreate } from '../../../../lib/edge/endpoints/invites.js'
import { urlValidate } from '../../../../lib/validate-util.js'
import { buildEpilog } from '../../../../lib/help.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& InputAndOutputItemFlags
	& {
		channel?: string
	}

const command = 'edge:channels:invites:create'

const describe = 'create an invitation'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiOrganizationCommandBuilder(yargs))
		.option('channel', {
			alias: 'C',
			describe: 'channel id',
			type: 'string',
			conflicts: ['input'],
		})
		.example([
			['$0 edge:channels:invites:create', 'create an invite from prompted input'],
			[
				'$0 edge:channels:invites:create --channel 19f12a0c-df0d-44fa-8cba-0d06fb206e42',
				'create an invite from prompted input for the specified channel',
			],
		])
		.epilog(buildEpilog({ command }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = edgeCommand(await apiOrganizationCommand(argv))

	const getInputFromUser = async (): Promise<InvitationCreate> => {
		const channelId = await chooseChannel(command, argv.channel,
			{ useConfigDefault: true })

		const name = await stringInput('Invitation name:')
		const description = await stringInput('Invitation description:')
		const owner = await stringInput('Invitation owner:')
		const termsUrl = await stringInput('Invitation termsUrl:', { validate: urlValidate })

		const defaultInvitationProfileId = '61a79569-e8fd-4a4d-9b9c-a4a55ccdd15e'
		const profileId = (command.profile.defaultInvitationProfileId as string)
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

	const create = async (_: void, input: InvitationCreate): Promise<Invitation> => {
		const { invitationId } = await command.edgeClient.invites.create(input)
		const invitation = await command.edgeClient.invites.get(invitationId)
		return invitation
	}

	const tableFieldDefinitions: TableFieldDefinition<Invitation>[] = [
		'id',
		{ path: 'metadata.name' },
		'profileId', 'expiration', 'acceptUrl']

	await inputAndOutputItem(command, { tableFieldDefinitions }, create, userInputProcessor(getInputFromUser))
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
