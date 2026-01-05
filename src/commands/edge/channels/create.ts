import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type Channel, type ChannelCreate } from '@smartthings/core-sdk'

import { buildEpilog } from '../../../lib/help.js'
import { type TableFieldDefinition } from '../../../lib/table-generator.js'
import { stringInput } from '../../../lib/user-query.js'
import { urlValidate } from '../../../lib/validate-util.js'
import {
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../../lib/command/api-organization-command.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemFlags,
} from '../../../lib/command/input-and-output-item.js'
import { userInputProcessor } from '../../../lib/command/input-processor.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& InputAndOutputItemFlags

const command = 'edge:channels:create'

const describe = 'create a channel'

const tableFieldDefinitions: TableFieldDefinition<Channel>[] = ['channelId', 'name', 'description',
	'type', 'termsOfServiceUrl', 'createdDate', 'lastModifiedDate']

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiOrganizationCommandBuilder(yargs))
		.example([
			[
				'$0 edge:channels:create',
				'create a channel from prompted input',
			],
			[
				'$0 edge:channels:create --input channel.json',
				'create a channel as defined in channel.json',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: 'createChannel' }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const getInputFromUser = async (): Promise<ChannelCreate> => {
		const name = await stringInput('Channel name:')
		const description = await stringInput('Channel description:')
		const termsOfServiceUrl = await stringInput('Channel terms of service URL:', { validate: urlValidate })

		return { name, description, termsOfServiceUrl, type: 'DRIVER' }
	}

	await inputAndOutputItem<ChannelCreate, Channel>(
		command,
		{ tableFieldDefinitions },
		(_, input: ChannelCreate) => command.client.channels.create(input),
		userInputProcessor(() => getInputFromUser()),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
