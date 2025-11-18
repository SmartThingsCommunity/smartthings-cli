import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type InstalledAppListOptions } from '@smartthings/core-sdk'

import { buildEpilog } from '../../lib/help.js'
import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../../lib/command/api-command.js'
import { chooseInstalledAppFn } from '../../lib/command/util/installedapps-util.js'


export type CommandArgs =
	& APICommandFlags
	& {
		location?: string[]
		verbose: boolean
		id?: string
	}

const command = 'installedapps:delete [id]'

const describe = 'delete an installed app'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiCommandBuilder(yargs)
		.option('location', {
			alias: 'l',
			describe: 'if prompting for an installed app, include only installed apps in the specified location(s)',
			type: 'string',
			array: true,
		})
		.option('verbose',
			{ alias: 'v', describe: 'include location name in output', type: 'boolean', default: false })
		.positional('id', { describe: 'installed app id', type: 'string' })
		.example([
			['$0 installedapps:delete', 'choose the installed app to delete from a list'],
			[
				'$0 installedapps:delete 5dfd6626-ab1d-42da-bb76-90def3153998',
				'delete the installed app with the specified id',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'deleteInstallation' }))


const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const listOptions: InstalledAppListOptions = {
		locationId: argv.location,
	}
	const chooseFunction = chooseInstalledAppFn({ listOptions, verbose: argv.verbose })
	const id = await chooseFunction(command, argv.id, { promptMessage: 'Select an installed app to delete.' })

	await command.client.installedApps.delete(id)
	console.log(`Installed app ${id} deleted.`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
