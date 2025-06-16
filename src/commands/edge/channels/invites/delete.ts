import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../../../../lib/command/api-command.js'
import { edgeCommand } from '../../../../lib/command/edge-command.js'
import { chooseChannel } from '../../../../lib/command/util/edge/channels-choose.js'
import { chooseInviteFn } from '../../../../lib/command/util/edge-invites-choose.js'


export type CommandArgs =
	& APICommandFlags
	& {
		channel?: string
		id?: string
	}

const command = 'edge:channels:invites:delete [id]'

const describe = 'delete a channel invitation'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiCommandBuilder(yargs)
		.option('channel', {
			alias: 'C',
			describe: 'channel id',
			type: 'string',
			conflicts: ['input'],
		})
		.positional('id', { describe: 'invite id', type: 'string' })
		.example([
			['$0 edge:channels:invites:delete', 'prompt for an invitation and delete it'],
			[
				'$0 edge:channels:invites:delete --channel 4af44f62-dbfd-45ec-831d-c3c2a6d57b97',
				'prompt for an invitation to the specified channel and delete it',
			],
			[
				'$0 edge:channels:invites:delete 929dc382-1b7b-43b0-a97b-577d2daecf0e',
				'delete the specified invite',
			],
		])

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = edgeCommand(await apiCommand(argv))

	const chooseInvite = async (): Promise<string> => {
		if (argv.id) {
			return argv.id
		}

		const channelId = await chooseChannel(command, argv.channel, { useConfigDefault: true } )

		return chooseInviteFn(command, { channelId })(
			command,
			argv.id,
			{ promptMessage: 'Choose an invitation to delete.' },
		)
	}

	const id = await chooseInvite()
	await command.edgeClient.invites.delete(id)
	console.log(`Invitation ${id} deleted.`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
