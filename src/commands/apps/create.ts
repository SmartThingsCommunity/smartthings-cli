import type { ArgumentsCamelCase, Argv, CommandModule } from 'yargs'

import { type AppCreateRequest, type AppCreationResponse } from '@smartthings/core-sdk'

import {
	apiCommand,
	apiCommandBuilder,
	type APICommandFlags,
	apiDocsURL,
} from '../../lib/command/api-command.js'
import { lambdaAuthBuilder, LambdaAuthFlags } from '../../lib/command/common-flags.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemFlags,
} from '../../lib/command/input-and-output-item.js'
import { userInputProcessor } from '../../lib/command/input-processor.js'
import {
	authorizeApp,
	tableFieldDefinitions,
} from '../../lib/command/util/apps-util.js'
import { getAppCreateRequestFromUser } from '../../lib/command/util/apps-util-user-input.js'


export type CommandArgs = APICommandFlags & InputAndOutputItemFlags & LambdaAuthFlags & {
	authorize: boolean
}

const command = 'apps:create'

const describe = 'create an app'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(lambdaAuthBuilder(apiCommandBuilder(yargs)))
		.option(
			'authorize',
			{
				describe: 'authorize Lambda functions to be called by SmartThings',
				type: 'boolean',
				default: false,
			},
		)
		.example([
			[ '$0 apps:create', 'create an OAuth-In app from prompted input'],
			['$0 apps:create -i my-app.yaml', 'create an app defined in "my-app.yaml'],
			[
				'$0 apps:create -i my-app.json --authorize',
				'create an app defined in "my-app.json" and then authorize it\n' +
					'(See "smartthings apps:authorize" for more information on authorization.)',
			],
		])
		.epilog(apiDocsURL('createApp'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const createApp = async (_: void, data: AppCreateRequest): Promise<AppCreationResponse> => {
		if (argv.authorize) {
			await authorizeApp(data, argv.principal, argv.statement)
		}
		return command.client.apps.create(data)
	}

	const buildTableOutput = (data: AppCreationResponse): string => {
		const basicInfo = command.tableGenerator.buildTableFromItem(data.app, tableFieldDefinitions)

		const oauthInfo = data.oauthClientId || data.oauthClientSecret
			? command.tableGenerator.buildTableFromItem(data, ['oauthClientId', 'oauthClientSecret'])
			: undefined
		return oauthInfo
			? `Basic App Data:\n${basicInfo}\n\n` +
				'OAuth Info (you will not be able to see the OAuth info again so please save' +
				` it now!):\n${oauthInfo}`
			: basicInfo
	}

	await inputAndOutputItem(
		command,
		{ buildTableOutput },
		createApp,
		userInputProcessor(() => getAppCreateRequestFromUser(command)),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
