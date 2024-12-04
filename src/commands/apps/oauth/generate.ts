import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import type { GenerateAppOAuthRequest, GenerateAppOAuthResponse } from '@smartthings/core-sdk'

import { TableFieldDefinition } from '../../../lib/table-generator.js'
import {
	apiCommand,
	apiCommandBuilder,
	APICommandFlags,
	apiDocsURL,
	itemInputHelpText,
} from '../../../lib/command/api-command.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	InputAndOutputItemConfig,
	InputAndOutputItemFlags,
} from '../../../lib/command/input-and-output-item.js'
import { inputProcessor } from '../../../lib/command/input-processor.js'
import { chooseApp } from '../../../lib/command/util/apps-util.js'
import { oauthAppScopeDef } from '../../../lib/command/util/apps-util-input-primitives.js'
import { objectDef, stringDef, updateFromUserInput } from '../../../lib/item-input/index.js'


export type CommandArgs = APICommandFlags & InputAndOutputItemFlags & {
	id?: string
}

const command = 'apps:oauth:generate [id]'

const describe = 'regenerate the OAuth clientId and clientSecret of an app'

const docNames = 'generateAppOauth'
const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiCommandBuilder(yargs))
		.positional('id', { describe: 'app id', type: 'string' })
		.example([
			[
				'$0 apps:oauth:generate',
				'prompt for an app and then regenerate the OAuth clientId and clientSecret for it',
			],
			[
				'$0 apps:oauth:generate 392bcb11-e251-44f3-b58b-17f93015f3aa',
				'regenerate the OAuth clientId and clientSecret of the app with the given id',
			],
		])
		.epilog(apiDocsURL(docNames))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const appId = await chooseApp(command, argv.id)

	const tableFieldDefinitions: TableFieldDefinition<GenerateAppOAuthResponse>[] = [
		{ path: 'oauthClientDetails.clientName' },
		{ path: 'oauthClientDetails.scope' },
		{ path: 'oauthClientDetails.redirectUris' },
		'oauthClientId',
		'oauthClientSecret',
	]
	const config: InputAndOutputItemConfig<GenerateAppOAuthResponse> = {
		tableFieldDefinitions,
	}
	const getInputFromUser = async (): Promise<GenerateAppOAuthRequest> => {
		const originalOauth = await command.client.apps.getOauth(appId)
		const startingRequest: GenerateAppOAuthRequest = {
			clientName: originalOauth.clientName,
			scope: originalOauth.scope ?? [],
		}
		const inputDef = objectDef('Generate Request', {
			clientName: stringDef('Client Name'),
			scope: oauthAppScopeDef,
		}, { helpText: itemInputHelpText(docNames) })

		return updateFromUserInput(command, inputDef, startingRequest, { dryRun: !!argv.dryRun })
	}

	await inputAndOutputItem(
		command,
		config,
		(_, data: GenerateAppOAuthRequest) => command.client.apps.regenerateOauth(appId, data),
		inputProcessor(() => true, getInputFromUser),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
