import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type SmartAppUpdateRequest, type SmartAppResponse } from '@smartthings/core-sdk'

import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../lib/command/api-organization-command.js'
import { buildEpilog } from '../../lib/help.js'
import { type TableCommonOutputProducer } from '../../lib/command/format.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemFlags,
} from '../../lib/command/input-and-output-item.js'
import { userInputProcessor } from '../../lib/command/input-processor.js'
import { type ActionFunction } from '../../lib/command/io-defs.js'
import { getAppUpdateRequestFromUser } from '../../lib/command/util/smartapps-user-input-update.js'
import { chooseSmartAppFn } from '../../lib/command/util/smartapps-choose.js'
import { tableFieldDefinitions } from '../../lib/command/util/smartapps-table.js'
import { paidAccountRequiredHandler } from '../../lib/command/util/smartapps-util.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& InputAndOutputItemFlags
	& {
		id?: string
	}

const command = 'smartapps:update [id]'

const describe = 'update a Smart App'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiOrganizationCommandBuilder(yargs))
		.positional('id', { describe: 'Smart App id', type: 'string' })
		.example([
			[
				'$0 smartapps:update',
				'prompt for a Smart App and edit it interactively',
			],
			[
				'$0 smartapps:update -i my-app.json',
				'prompt for a Smart App and update it using the data in "my-app.json"',
			],
			[
				'$0 smartapps:update 392bcb11-e251-44f3-b58b-17f93015f3aa -i my-app.json',
				'update the Smart App with the given id using the data in "my-app.json"',
			],
		])
		.epilog(buildEpilog({
			command,
			notes: 'See smartapps:oauth:update and smartapps:oauth:generate for updating oauth-related data.',
			apiDocs: ['updateSmartApp'],
		}))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)
	const appId = await chooseSmartAppFn({
		appType: 'API_ONLY',
		accountId: command.client.config.headers?.['X-ST-Organization'],
	})(command, argv.id).catch(paidAccountRequiredHandler('Listing Smart Apps'))

	const executeUpdate: ActionFunction<void, SmartAppUpdateRequest, SmartAppResponse> = async (_, data) =>
		command.client.smartapps.update(appId, data)
			.catch(paidAccountRequiredHandler('Updating a Smart App'))

	const config: TableCommonOutputProducer<SmartAppResponse> = { tableFieldDefinitions }
	await inputAndOutputItem(
		command,
		config,
		executeUpdate,
		userInputProcessor(() => getAppUpdateRequestFromUser(command, appId)),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
