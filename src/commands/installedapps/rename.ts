import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type InstalledAppListOptions } from '@smartthings/core-sdk'

import { buildEpilog } from '../../lib/help.js'
import { stringInput } from '../../lib/user-query.js'
import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../../lib/command/api-command.js'
import {
	formatAndWriteItem,
	formatAndWriteItemBuilder,
	type FormatAndWriteItemFlags,
} from '../../lib/command/format.js'
import { tableFieldDefinitions } from '../../lib/command/util/installedapps-table.js'
import { chooseInstalledAppFn } from '../../lib/command/util/installedapps-util.js'


export type CommandArgs =
	& APICommandFlags
	& FormatAndWriteItemFlags
	& {
		location?: string[]
		verbose: boolean
		id?: string
		newName?: string
	}

const command = 'installedapps:rename [id] [new-name]'

const describe = 'rename an installed app instance'

export const builder = (yargs: Argv): Argv<CommandArgs> =>
	formatAndWriteItemBuilder(apiCommandBuilder(yargs))
		.positional('id', { describe: 'installed app id', type: 'string' })
		.option('location', {
			alias: 'l',
			describe: 'filter installed apps for prompt by location',
			type: 'string',
			array: true,
		})
		.option('verbose',
			{ alias: 'v', describe: 'include location names in prompt', type: 'boolean', default: false })
		.option('new-name', { describe: 'the new name for the installed app', type: 'string' })
		.example([
			[
				'$0 installedapps:rename',
				'prompt for an installed app and new name for it',
			],
			[
				'$0 installedapps:rename 80b76675-86c6-470d-a65e-d996b28764b8 "New Name"',
				'rename the installed app with the specified id to "New Name"',
			],
		])
		.epilog(buildEpilog({ command }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const listOptions: InstalledAppListOptions = { locationId: argv.location }
	const installedAppId = await chooseInstalledAppFn({ verbose: argv.verbose, listOptions })(command, argv.id)

	const displayName = argv.newName ?? await stringInput('Enter new installed app name:')
	const updatedApp = await command.client.installedApps.update(installedAppId, { displayName })
	await formatAndWriteItem(command, { tableFieldDefinitions }, updatedApp)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
