import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { buildEpilog } from '../../lib/help.js'
import {
	type APIOrganizationCommandFlags,
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
} from '../../lib/command/api-organization-command.js'
import { chooseSmartAppFn } from '../../lib/command/util/smartapps-choose.js'


export type CommandArgs = APIOrganizationCommandFlags & {
	id?: string
}

const command = 'smartapps:delete [id]'

const describe = 'delete a Smart App'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiOrganizationCommandBuilder(yargs)
		.positional('id', { describe: 'Smart App id', type: 'string' })
		.example([
			['$0 smartapps:delete', 'choose the Smart App to delete from a list'],
			[
				'$0 smartapps:delete 5dfd6626-ab1d-42da-bb76-90def3153998',
				'delete the Smart App with the specified id',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'deleteSmartApp' }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const id = await chooseSmartAppFn({ accountId: command.client.config.headers?.['X-ST-Organization'] })(command, argv.id)
	await command.client.smartapps.delete(id)
	console.log(`Smart App ${id} deleted.`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
