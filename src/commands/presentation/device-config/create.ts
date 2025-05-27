import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type PresentationDeviceConfigCreate, type PresentationDeviceConfig } from '@smartthings/core-sdk'

import { apiCommand, apiCommandBuilder, type APICommandFlags, apiDocsURL } from '../../../lib/command/api-command.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemFlags,
} from '../../../lib/command/input-and-output-item.js'
import { buildTableOutput } from '../../../lib/command/util/presentation-device-config-table.js'


export type CommandArgs =
	& APICommandFlags
	& InputAndOutputItemFlags

const command = 'presentation:device-config:create'

const describe = 'create a device config'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiCommandBuilder(yargs))
		.example([
			[
				'$0 presentation:device-config:create --input device-config.json',
				'create a device config as defined in device-config.json',
			],
		])
		.epilog(apiDocsURL('createDeviceConfiguration'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	await inputAndOutputItem<PresentationDeviceConfigCreate, PresentationDeviceConfig>(
		command,
		{ buildTableOutput: data => buildTableOutput(command.tableGenerator, data) },
		(_, deviceConfig) => command.client.presentation.create(deviceConfig),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
