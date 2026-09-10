import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type SmartAppOAuthRequest } from '@smartthings/core-sdk'

import { buildEpilog, itemInputHelpText } from '../../../lib/help.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	APIOrganizationCommandFlags,
} from '../../../lib/command/api-organization-command.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	InputAndOutputItemFlags,
} from '../../../lib/command/input-and-output-item.js'
import { userInputProcessor } from '../../../lib/command/input-processor.js'
import { chooseSmartAppFn } from '../../../lib/command/util/smartapps-choose.js'
import { oauthTableFieldDefinitions } from '../../../lib/command/util/smartapps-table.js'
import {
	corsDomainsDef,
	oauthAppScopeDef,
	redirectUrisDef,
} from '../../../lib/command/util/smartapps-input-primitives.js'
import { objectDef, stringDef, updateFromUserInput } from '../../../lib/item-input/index.js'


export type CommandArgs = APIOrganizationCommandFlags & InputAndOutputItemFlags & {
	id?: string
}

const command = 'smartapps:oauth:update [id]'

const describe = 'update the OAuth settings of a Smart App'

const docNames = 'updateSmartAppOauth'
const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiOrganizationCommandBuilder(yargs))
		.positional('id', { describe: 'Smart App id', type: 'string' })
		.example([
			[
				'$0 smartapps:oauth:update',
				'prompt for a Smart App and update its OAuth settings interactively',
			],
			[
				'$0 smartapps:oauth:update -i oauth-settings.json',
				'prompt for a Smart App and update its OAuth settings using the data in "oauth-settings.json',
			],
			[
				'$0 smartapps:oauth:update 392bcb11-e251-44f3-b58b-17f93015f3aa -i oauth-settings.json',
				'update OAuth settings for the Smart App with the given id using the data in "oauth-settings.json"',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: [docNames] }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const appId = await chooseSmartAppFn({ accountId: command.client.config.headers?.['X-ST-Organization'] })(command, argv.id)

	const getInputFromUser = async (): Promise<SmartAppOAuthRequest> => {
		const startingRequest: SmartAppOAuthRequest = await command.client.smartapps.getOauth(appId)
		if (!startingRequest.scope) {
			startingRequest.scope = []
		}
		if (!startingRequest.corsDomains) {
			startingRequest.corsDomains = []
		}
		const inputDef = objectDef('OAuth Settings', {
			clientName: stringDef('Client Name'),
			scope: oauthAppScopeDef,
			redirectUris: redirectUrisDef,
			corsDomains: corsDomainsDef,
		}, { helpText: itemInputHelpText(docNames) })

		return updateFromUserInput(command, inputDef, startingRequest, { dryRun: !!argv.dryRun })
	}

	await inputAndOutputItem(command, { tableFieldDefinitions: oauthTableFieldDefinitions },
		(_, data: SmartAppOAuthRequest) => command.client.smartapps.updateOauth(appId, data),
		userInputProcessor(getInputFromUser))
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
