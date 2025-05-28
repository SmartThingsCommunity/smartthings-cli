import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../../../../lib/command/api-command.js'
import { edgeCommand } from '../../../../lib/command/edge-command.js'


export type CommandArgs =
	& APICommandFlags
	& {
		id: string
	}

const command = 'edge:channels:invites:accept <id>'

const describe = 'accept a channel invitation'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiCommandBuilder(yargs)
		.positional('id', { describe: 'invite id', type: 'string', demandOption: true })
		.example([
			[
				'$0 edge:channels:invites:accept e09f544d-4eb1-458f-899f-ff93d1ba9396',
				'accept the specified invite',
			],
		])

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = edgeCommand(await apiCommand(argv))

	const id = argv.id
	await command.edgeClient.invites.accept(id)
	console.log(`Invitation ${id} accepted.`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
