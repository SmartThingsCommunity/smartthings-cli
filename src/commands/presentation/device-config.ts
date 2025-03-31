import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { apiCommand, apiCommandBuilder, APICommandFlags, apiDocsURL } from '../../lib/command/api-command.js'
import { outputItem, outputItemBuilder, OutputItemFlags } from '../../lib/command/output-item.js'
import { buildTableOutput } from '../../lib/command/util/presentation-device-config-table.js'


export type CommandArgs =
	& APICommandFlags
	& OutputItemFlags
	& {
		presentationId?: string
		manufacturerName?: string
	}

const command = 'presentation:device-config <presentationId> [manufacturer-name]'

const describe = 'query device config by presentationId'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemBuilder(apiCommandBuilder(yargs))
		.positional('presentation-id', {
			describe: 'system generated identifier that corresponds to a device presentation',
			type: 'string',
			required: true,
		})
		.positional('manufacturer-name', {
			describe: 'manufacturer name',
			type: 'string',
			default: 'SmartThingsCommunity',
		})
		.example([
			[
				'$0 presentation:device-config 392bcb11-e251-44f3-b58b-17f93015f3aa',
				'get the device config for the given presentation id',
			],
		])
		.epilog(apiDocsURL('getDeviceConfiguration'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	await outputItem(
		command,
		{ buildTableOutput: data => buildTableOutput(command.tableGenerator, data) },
		// presentationId is required in the `positional` argument above so it will always be set here.
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		() => command.client.presentation.get(argv.presentationId!, argv.manufacturerName),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
