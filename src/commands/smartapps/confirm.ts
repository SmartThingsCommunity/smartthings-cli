import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../lib/command/api-organization-command.js'
import { buildEpilog } from '../../lib/help.js'
import { chooseSmartAppFn } from '../../lib/command/util/smartapps-choose.js'


export type CommandArgs = APIOrganizationCommandFlags & {
	id?: string
}

const command = 'smartapps:confirm [id]'

const describe = 'send request to Smart App target URL to confirm existence and authorize lifecycle events'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiOrganizationCommandBuilder(yargs)
		.positional('id', { describe: 'Smart App id', type: 'string' })
		.example([
			['$0 smartapps:confirm', 'choose the app to confirm from a list'],
			[
				'$0 smartapps:confirm 392bcb11-e251-44f3-b58b-17f93015f3aa',
				'send confirmation request to the app with the given id',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'registerSmartApp' }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const id = await chooseSmartAppFn({
		appType: 'API_ONLY',
		accountId: command.client.config.headers?.['X-ST-Organization'],
	})(command, argv.id)

	await command.client.smartapps.register(id)
	console.log(`Confirmation request sent to Smart App ${id}. Check server log for confirmation URL.`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
