import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type PresentationDeviceConfig } from '@smartthings/core-sdk'

import { apiCommand, apiCommandBuilder, type APICommandFlags, apiDocsURL } from '../../../lib/command/api-command.js'
import { outputItem, outputItemBuilder, type OutputItemFlags } from '../../../lib/command/output-item.js'
import { buildTableOutput } from '../../../lib/command/util/presentation-device-config-table.js'


export type CommandArgs =
	& APICommandFlags
	& OutputItemFlags
	& {
		id: string
	}

const command = 'presentation:device-config:generate <id>'

const describe = 'generate the default device configuration'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemBuilder(apiCommandBuilder(yargs))
		.positional('id', { describe: 'the profile id', type: 'string', demandOption: true })
		.example([
			[
				'$0 presentation:device-config:generate bdd26911-18ce-4d56-b6cf-0302b91b1336',
				'generate a device config for the specified device profile',
			],
		])
		.epilog(apiDocsURL('generateDeviceConfig'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const config = {
		buildTableOutput: (data: PresentationDeviceConfig) => buildTableOutput(command.tableGenerator, data),
	}
	await outputItem<PresentationDeviceConfig>(command, config,
		() => command.client.presentation.generate(argv.id))
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
