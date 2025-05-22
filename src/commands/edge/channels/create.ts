import inquirer from 'inquirer'
import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type Channel, type ChannelCreate } from '@smartthings/core-sdk'

import { apiCommand, apiCommandBuilder, type APICommandFlags, apiDocsURL } from '../../../lib/command/api-command.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemFlags,
} from '../../../lib/command/input-and-output-item.js'
import { type TableFieldDefinition } from '../../../lib/table-generator.js'
import { userInputProcessor } from '../../../lib/command/input-processor.js'


export type CommandArgs =
	& APICommandFlags
	& InputAndOutputItemFlags

const command = 'edge:channels:create'

const describe = 'create a channel'

const tableFieldDefinitions: TableFieldDefinition<Channel>[] = ['channelId', 'name', 'description',
	'type', 'termsOfServiceUrl', 'createdDate', 'lastModifiedDate']

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiCommandBuilder(yargs))
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
		.epilog(apiDocsURL('createChannel'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const getInputFromUser = async (): Promise<ChannelCreate> => {
		const name = (await inquirer.prompt({
			type: 'input',
			name: 'name',
			message: 'Channel name:',
			validate: input => input ? true : 'name is required',
		})).name as string

		const description = (await inquirer.prompt({
			type: 'input',
			name: 'description',
			message: 'Channel description:',
			validate: input => input ? true : 'description is required',
		})).description as string

		const termsOfServiceUrl = (await inquirer.prompt({
			type: 'input',
			name: 'termsOfServiceUrl',
			message: 'Channel terms of service URL:',
			validate: input => input ? true : 'termsOfServiceUrl is required',
		})).termsOfServiceUrl as string

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
