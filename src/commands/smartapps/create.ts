import type { ArgumentsCamelCase, Argv, CommandModule } from 'yargs'

import { type SmartAppCreateRequest, type SmartAppCreationResponse } from '@smartthings/core-sdk'

import { buildEpilog } from '../../lib/help.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../lib/command/api-organization-command.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemFlags,
} from '../../lib/command/input-and-output-item.js'
import { userInputProcessor } from '../../lib/command/input-processor.js'
import { tableFieldDefinitions } from '../../lib/command/util/smartapps-table.js'
import { paidAccountRequiredHandler } from '../../lib/command/util/smartapps-util.js'
import { getAppCreateRequestFromUser } from '../../lib/command/util/smartapps-user-input-create.js'
import { chooseOrganization } from '../../lib/command/util/organizations-util.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& InputAndOutputItemFlags

const command = 'smartapps:create'

const describe = 'create a Smart App'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiOrganizationCommandBuilder(yargs))
		.example([
			[ '$0 smartapps:create', 'create an API Access app from prompted input'],
			['$0 smartapps:create -i my-app.yaml', 'create an app defined in "my-app.yaml"'],
		])
		.epilog(buildEpilog({
			command,
			apiDocs: ['createSmartApp'],
			notes: 'Running this command is similar to "Register" in the Developer Center.' +
				'\n    https://developers.smartthingsgdev.com/console/service-integrations',
		}))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const accountId = argv.dryRun ? undefined : await chooseOrganization(
		command,
		command.client.config.headers?.['X-ST-Organization'],
		{
			autoChoose: true,
			notATTYMessage: 'Input and/or output is not an interactive terminal.' +
				'\nYou must specify an organization via the command line or config file.',
		},
	)

	const createSmartApp = async (_: void, data: SmartAppCreateRequest): Promise<SmartAppCreationResponse> =>
		command.client.smartapps.create(data, accountId)
			.catch(paidAccountRequiredHandler('Creating a Smart App'))

	const buildTableOutput = (data: SmartAppCreationResponse): string => {
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
		createSmartApp,
		userInputProcessor(() => getAppCreateRequestFromUser(command)),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
