import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import {
	apiCommand,
	apiCommandBuilder,
	type APICommandFlags,
} from '../../lib/command/api-command.js'
import { buildEpilog } from '../../lib/help.js'
import {
	formatAndWriteItem,
	formatAndWriteItemBuilder,
	type FormatAndWriteItemFlags,
} from '../../lib/command/format.js'
import { chooseDevice } from '../../lib/command/util/devices-choose.js'
import { buildTableOutput } from '../../lib/command/util/presentation-table.js'


export type CommandArgs =
	& APICommandFlags
	& FormatAndWriteItemFlags
	& {
		idOrIndex?: string
	}

const command = 'devices:presentation [id-or-index]'

const describe = 'get a device presentation'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	formatAndWriteItemBuilder(apiCommandBuilder(yargs))
		.positional('id-or-index', { describe: 'device id or number from list', type: 'string' })
		.example([
			['$0 devices:presentation', 'choose a device from a list and display its presentation'],
			[
				'$0 devices:presentation 3',
				'display the presentation for the third device listed when running "smartthings devices"',
			],
			[
				'$0 devices:presentation a13a3fbb-2b97-4c73-978d-ae7c2fca3ea8',
				'display the presentation for the specified device',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: ['getDevicePresentation'] }))


const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const deviceId = await chooseDevice(command, argv.idOrIndex, { allowIndex: true })
	const presentation = await command.client.devices.getPresentation(deviceId)
	await formatAndWriteItem(
		command,
		{ buildTableOutput: data => buildTableOutput(command.tableGenerator, data) },
		presentation,
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
