import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { AppOAuthRequest } from '@smartthings/core-sdk'

import { buildEpilog, itemInputHelpText } from '../../../lib/help.js'
import {
	apiCommand,
	apiCommandBuilder,
	APICommandFlags,
} from '../../../lib/command/api-command.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	InputAndOutputItemFlags,
} from '../../../lib/command/input-and-output-item.js'
import { inputProcessor } from '../../../lib/command/input-processor.js'
import { chooseApp, oauthTableFieldDefinitions } from '../../../lib/command/util/apps-util.js'
import {
	oauthAppScopeDef,
	redirectUrisDef,
} from '../../../lib/command/util/apps-input-primitives.js'
import { objectDef, stringDef, updateFromUserInput } from '../../../lib/item-input/index.js'


export type CommandArgs = APICommandFlags & InputAndOutputItemFlags & {
	id?: string
}

const command = 'apps:oauth:update [id]'

const describe = 'update the OAuth settings of an app'

const docNames = 'updateAppOauth'
const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiCommandBuilder(yargs))
		.positional('id', { describe: 'app id', type: 'string' })
		.example([
			[
				'$0 apps:oauth:update',
				'prompt for an app and update its OAuth settings interactively"',
			],
			[
				'$0 apps:oauth:update -i oauth-settings.json',
				'prompt for an app and update its OAuth settings using the data in "oauth-settings.json',
			],
			[
				'$0 apps:oauth:update 392bcb11-e251-44f3-b58b-17f93015f3aa -i oauth-settings.json',
				'update OAuth settings for the app with the given id using the data in "oauth-settings.json"',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: [docNames] }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const appId = await chooseApp(command, argv.id)

	const getInputFromUser = async (): Promise<AppOAuthRequest> => {
		const startingRequest: AppOAuthRequest = await command.client.apps.getOauth(appId)
		if (!startingRequest.scope) {
			startingRequest.scope = []
		}
		const inputDef = objectDef('OAuth Settings', {
			clientName: stringDef('Client Name'),
			scope: oauthAppScopeDef,
			redirectUris: redirectUrisDef,
		}, { helpText: itemInputHelpText(docNames) })

		return updateFromUserInput(command, inputDef, startingRequest, { dryRun: !!argv.dryRun })
	}

	await inputAndOutputItem(command, { tableFieldDefinitions: oauthTableFieldDefinitions },
		(_, data: AppOAuthRequest) => command.client.apps.updateOauth(appId, data),
		inputProcessor(() => true, getInputFromUser))
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
