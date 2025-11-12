import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { AppType, type PagedApp } from '@smartthings/core-sdk'

import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../../lib/command/api-command.js'
import { buildEpilog } from '../../lib/help.js'
import { chooseApp } from '../../lib/command/util/apps-util.js'


export type CommandArgs = APICommandFlags & {
	id?: string
}

const command = 'apps:register [id]'

const describe = 'send request to app target URL to confirm existence and authorize lifecycle events'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiCommandBuilder(yargs)
		.positional('id', { describe: 'app id', type: 'string' })
		.example([
			['$0 apps:register', 'choose the app to register from a list'],
			[
				'$0 apps:register 392bcb11-e251-44f3-b58b-17f93015f3aa',
				'send registration request to the app with the given id',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: ['register'] }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const id = await chooseApp(
		command,
		argv.id,
		{
			listFilter: (app: PagedApp): boolean =>
				app.appType === AppType.WEBHOOK_SMART_APP || app.appType === AppType.API_ONLY,
		},
	)

	await command.client.apps.register(id)
	console.log(`Registration request sent to app ${id}. Check server log for confirmation URL.`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
