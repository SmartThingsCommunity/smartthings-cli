import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import type { GenerateSmartAppOAuthRequest, GenerateSmartAppOAuthResponse } from '@smartthings/core-sdk'

import { buildEpilog, itemInputHelpText } from '../../../lib/help.js'
import { type TableFieldDefinition } from '../../../lib/table-generator.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../../lib/command/api-organization-command.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemConfig,
	type InputAndOutputItemFlags,
} from '../../../lib/command/input-and-output-item.js'
import { userInputProcessor } from '../../../lib/command/input-processor.js'
import { oauthAppScopeDef } from '../../../lib/command/util/smartapps-input-primitives.js'
import { chooseSmartAppFn } from '../../../lib/command/util/smartapps-choose.js'
import { objectDef, stringDef, updateFromUserInput } from '../../../lib/item-input/index.js'


export type CommandArgs = APIOrganizationCommandFlags & InputAndOutputItemFlags & {
	id?: string
}

const command = 'smartapps:oauth:generate [id]'

const describe = 'regenerate the OAuth clientId and clientSecret of a Smart App'

const docNames = 'generateSmartAppOauth'
const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiOrganizationCommandBuilder(yargs))
		.positional('id', { describe: 'Smart App id', type: 'string' })
		.example([
			[
				'$0 smartapps:oauth:generate',
				'prompt for a Smart App and then regenerate the OAuth clientId and clientSecret for it',
			],
			[
				'$0 smartapps:oauth:generate 392bcb11-e251-44f3-b58b-17f93015f3aa',
				'regenerate the OAuth clientId and clientSecret of the Smart App with the given id',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: [docNames] }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const appId = await chooseSmartAppFn({ accountId: command.client.config.headers?.['X-ST-Organization'] })(command, argv.id)

	const tableFieldDefinitions: TableFieldDefinition<GenerateSmartAppOAuthResponse>[] = [
		{ path: 'oauthClientDetails.clientName' },
		{ path: 'oauthClientDetails.scope' },
		{ path: 'oauthClientDetails.redirectUris' },
		{ path: 'oauthClientDetails.corsDomains' },
		'oauthClientId',
		'oauthClientSecret',
	]
	const config: InputAndOutputItemConfig<GenerateSmartAppOAuthResponse> = {
		tableFieldDefinitions,
	}
	const getInputFromUser = async (): Promise<GenerateSmartAppOAuthRequest> => {
		const originalOauth = await command.client.smartapps.getOauth(appId)
		const startingRequest: GenerateSmartAppOAuthRequest = {
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
		(_, data: GenerateSmartAppOAuthRequest) => command.client.smartapps.regenerateOauth(appId, data),
		userInputProcessor(getInputFromUser),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
