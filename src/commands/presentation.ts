import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type PresentationDevicePresentation } from '@smartthings/core-sdk'

import { apiCommand, apiCommandBuilder, apiDocsURL, type APICommandFlags } from '../lib/command/api-command.js'
import { outputItem, outputItemBuilder, type OutputItemFlags } from '../lib/command/output-item.js'
import { buildTableOutput } from '../lib/command/util/presentation-table.js'


export type CommandArgs =
	& APICommandFlags
	& OutputItemFlags
	& {
		presentationId?: string
		manufacturerName?: string
	}

const command = 'presentation <presentationId> [manufacturer-name]'

const describe = 'query device presentation by presentation id'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemBuilder(apiCommandBuilder(yargs))
		.positional(
			'presentation-id',
			{
				describe: 'system generated identifier that corresponds to a device presentation',
				type: 'string',
				required: true,
			},
		)
		.positional(
			'manufacturer-name',
			{
				describe: 'manufacturer name, defaults to SmartThingsCommunity',
				type: 'string',
			},
		)
		.example([
			[
				'$0 presentation fd4adb7f-4a23-4134-9b39-05ed889a03cf',
				'display the specified presentation, which is associated with the SmartThingsCommunity manufacturer id'],
			[
				'$0 devices presentation 4ea31e30-2aba-41c7-a3ec-8f97423d565a DoodadsInc',
				'display the specified presentation, which is associated with the DoodadsInc manufacturer id',
			],
		])
		.epilog('The language can be overridden by specifying an ISO language code with the "--language" option. If' +
			' "NONE" is specified for the language code then no language header is specified in the API request.\n\n' +
			apiDocsURL('getDevicePresentation'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const config = {
		buildTableOutput: (data: PresentationDevicePresentation) => buildTableOutput(command.tableGenerator, data),
	}
	await outputItem(
		command,
		config,
		// presentationId is required in the `positional` argument above so it will always be set here.
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		() => command.client.presentation.getPresentation(argv.presentationId!, argv.manufacturerName))
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
