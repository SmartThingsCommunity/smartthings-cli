import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type SmartAppSettingsRequest, type SmartAppSettingsResponse } from '@smartthings/core-sdk'

import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../../lib/command/api-organization-command.js'
import { buildEpilog } from '../../../lib/help.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemFlags,
} from '../../../lib/command/input-and-output-item.js'
import { chooseSmartAppFn } from '../../../lib/command/util/smartapps-choose.js'
import { buildTableOutput } from '../../../lib/command/util/smartapps-table.js'


export type CommandArgs = APIOrganizationCommandFlags & InputAndOutputItemFlags & {
	id?: string
}

const command = 'smartapps:settings:update [id]'

const describe = 'update the settings of a Smart App'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiOrganizationCommandBuilder(yargs))
		.positional('id', { describe: 'Smart App id', type: 'string' })
		.example([
			[
				'$0 smartapps:settings:update 392bcb11-e251-44f3-b58b-17f93015f3aa -i app-settings.json',
				'update the settings of the Smart App with the given id using the data in "app-settings.json"',
			],
			[
				'$0 smartapps:settings:update -i app-settings.json',
				'ask for the id of a Smart App to update and then update it using the data in "app-settings.json"',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'updateSmartAppSettings' }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)
	const appId = await chooseSmartAppFn({ accountId: command.client.config.headers?.['X-ST-Organization'] })(command, argv.id)
	await inputAndOutputItem(
		command,
		{ buildTableOutput: (data: SmartAppSettingsResponse) => buildTableOutput(command.tableGenerator, data) },
		(_, data: SmartAppSettingsRequest) => command.client.smartapps.updateSettings(appId, data),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
