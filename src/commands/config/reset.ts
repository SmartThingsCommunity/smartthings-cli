import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { resetManagedConfig } from '../../lib/cli-config.js'
import { askForBoolean } from '../../lib/user-query.js'
import {
	smartThingsCommand,
	smartThingsCommandBuilder,
	type SmartThingsCommandFlags,
} from '../../lib/command/smartthings-command.js'


export type CommandArgs =
	& SmartThingsCommandFlags

const command = 'config:reset'

const describe = 'clear saved answers to questions'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	smartThingsCommandBuilder(yargs)
		.example([
			['$0 config:reset', 'reset cli-managed configuration for the default profile'],
			['$0 config:reset --profile hub2', 'reset cli-managed configuration for the profile named "hub2"'],
		])
		.epilog('The CLI will occasionally ask you if you want it to remember the answer to a question, such as ' +
			'"Which hub do you want to use?" You can use this command to clear those answers.')

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await smartThingsCommand(argv)

	const message = 'Are you sure you want to clear saved answers to questions' +
		`${command.profileName === 'default' ? '' : ` for the profile ${command.profileName}`}?`
	const confirmed = await askForBoolean(message, { default: false })

	if (confirmed) {
		await resetManagedConfig(command.cliConfig, command.profileName)
		console.log('Configuration has been reset.')
	} else {
		console.log('Configuration reset canceled.')
	}
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
