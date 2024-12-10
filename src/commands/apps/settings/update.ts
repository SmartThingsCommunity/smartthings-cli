import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type AppSettingsRequest, type AppSettingsResponse } from '@smartthings/core-sdk'

import {
	apiCommand,
	apiCommandBuilder,
	apiDocsURL,
	type APICommandFlags,
} from '../../../lib/command/api-command.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemFlags,
} from '../../../lib/command/input-and-output-item.js'
import { buildTableOutput, chooseApp } from '../../../lib/command/util/apps-util.js'


export type CommandArgs = APICommandFlags & InputAndOutputItemFlags & {
	id?: string
}

const command = 'apps:settings:update [id]'

const describe = 'update the settings of an app'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiCommandBuilder(yargs))
		.positional('id', { describe: 'app id', type: 'string' })
		.example([
			[
				'$0 apps:settings:update 392bcb11-e251-44f3-b58b-17f93015f3aa -i app-settings.json',
				'update the settings of the app with the given id using the data in "app-settings.json"',
			],
			[
				'$0 apps:settings:update -i app-settings.json',
				'ask for the ID of an app to update and then update it using the data in "app-settings.json"',
			],
		])
		.epilog(apiDocsURL('updateAppSettings'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)
	const appId = await chooseApp(command, argv.id)
	await inputAndOutputItem(
		command,
		{ buildTableOutput: (data: AppSettingsResponse) => buildTableOutput(command.tableGenerator, data) },
		(_, data: AppSettingsRequest) => command.client.apps.updateSettings(appId, data),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
