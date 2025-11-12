import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type AppUpdateRequest, type AppResponse } from '@smartthings/core-sdk'

import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../../lib/command/api-command.js'
import { buildEpilog } from '../../lib/help.js'
import { lambdaAuthBuilder, type LambdaAuthFlags } from '../../lib/command/common-flags.js'
import { type TableCommonOutputProducer } from '../../lib/command/format.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemFlags,
} from '../../lib/command/input-and-output-item.js'
import { userInputProcessor } from '../../lib/command/input-processor.js'
import { type ActionFunction } from '../../lib/command/io-defs.js'
import { getAppUpdateRequestFromUser } from '../../lib/command/util/apps-user-input-update.js'
import { authorizeApp, chooseApp, tableFieldDefinitions } from '../../lib/command/util/apps-util.js'


export type CommandArgs =
	& APICommandFlags
	& LambdaAuthFlags
	& InputAndOutputItemFlags
	& {
		authorize: boolean
		id?: string
	}

const command = 'apps:update [id]'

const describe = 'update the settings of the app'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(lambdaAuthBuilder(apiCommandBuilder(yargs)))
		.positional('id', { describe: 'app id', type: 'string' })
		.option(
			'authorize',
			{ describe: 'authorize Lambda functions to be called by SmartThings', type: 'boolean', default: false },
		)
		.example([
			[
				'$0 apps:update',
				'prompt for an app and edit it interactively',
			],
			[
				'$0 apps:update -i my-app.json',
				'prompt for an app and update it using the data in "my-app.json"',
			],
			[
				'$0 apps:update 392bcb11-e251-44f3-b58b-17f93015f3aa -i my-app.json',
				'update the app with the given id using the data in "my-app.json"',
			],
			[
				'$0 apps:update 392bcb11-e251-44f3-b58b-17f93015f3aa -i my-app.json --authorize',
				'update the given app using the data in "my-app.json" and then authorize it\n' +
					'(See "smartthings apps:authorize" for more information on authorization.)',
			],
		])
		.epilog('See apps:oauth:update and apps:oauth:generate for updating oauth-related data.\n\n' +
			buildEpilog({ command, apiDocs: ['updateApp'] }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)
	const appId = await chooseApp(command, argv.id)

	const executeUpdate: ActionFunction<void, AppUpdateRequest, AppResponse> = async (_, data) => {
		if (argv.authorize) {
			await authorizeApp(data, argv.principal, argv.statement)
		}
		return command.client.apps.update(appId, data)
	}

	const config: TableCommonOutputProducer<AppResponse> = { tableFieldDefinitions }
	await inputAndOutputItem(
		command,
		config,
		executeUpdate,
		userInputProcessor(() => getAppUpdateRequestFromUser(command, appId)),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
