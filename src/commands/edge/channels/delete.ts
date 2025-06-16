import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { resetManagedConfigKey } from '../../../lib/cli-config.js'
import { apiCommand, apiCommandBuilder, apiDocsURL, type APICommandFlags } from '../../../lib/command/api-command.js'
import { chooseChannel } from '../../../lib/command/util/edge/channels-choose.js'


export type CommandArgs =
	& APICommandFlags
	& {
		id?: string
	}

const command = 'edge:channels:delete [id]'

const describe = 'delete a channel'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiCommandBuilder(yargs)
		.positional('id', { describe: 'channel id', type: 'string' })
		.example([
			['$0 edge:channels:delete', 'choose the channel to delete from a list'],
			[
				'$0 edge:channels:delete 636169e4-8b9f-4438-a941-953b0d617231',
				'delete the channel with the specified id',
			],
		])
		.epilog(apiDocsURL('deleteChannel'))


const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const id = await chooseChannel(command, argv.id, { promptMessage: 'Choose a channel to delete.' })
	await command.client.channels.delete(id)
	await resetManagedConfigKey(command.cliConfig, 'defaultChannel', value => value === id)
	console.log(`Channel ${id} deleted.`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
