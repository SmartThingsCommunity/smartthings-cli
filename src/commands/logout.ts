import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../lib/command/api-command.js'
import { fatalError } from '../lib/util.js'


export type CommandArgs = APICommandFlags

const command = 'logout'

const describe = 'force login next time the specified (or default) profile is used'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiCommandBuilder(yargs)
		.example([
			['$0', 'log out of default profile'],
			['$0 --profile hub2', 'log out of profile named "hub2"'],
		])

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	if (command.token || !command.authenticator.logout) {
		const errorMsg = command.profile.token
			? `Profile ${command.profileName} is set up using a bearer token.`
			: 'Cannot log out with a bearer token.'
		return fatalError(errorMsg)
	}

	await command.authenticator.logout()
	console.log('logged out')
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
