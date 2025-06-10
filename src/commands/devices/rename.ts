import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { stringInput } from '../../lib/user-query.js'
import { apiCommand, apiCommandBuilder, type APICommandFlags, apiDocsURL } from '../../lib/command/api-command.js'
import { outputItem, outputItemBuilder, type OutputItemFlags } from '../../lib/command/output-item.js'
import { chooseDevice } from '../../lib/command/util/devices-choose.js'
import { buildTableOutput } from '../../lib/command/util/devices-table.js'


export type CommandArgs =
	& APICommandFlags
	& OutputItemFlags
	& {
		id?: string
		newLabel?: string
	}

const command = 'devices:rename [id] [new-label]'

const describe = 'rename a device'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	outputItemBuilder(apiCommandBuilder(yargs))
		.positional('id', { describe: 'device id', type: 'string' })
		.positional('new-label', { describe: 'new device label', type: 'string' })
		.example([
			['$0 devices:rename', 'prompt for a device and a new label and rename the chosen device'],
			[
				'$0 devices:rename f22bb71f-b6a0-43de-9131-20e7dfc0f973 "New Name"',
				'rename the specified device with the specified name',
			],
		])
		.epilog(apiDocsURL('updateDevice'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const id = await chooseDevice(command, argv.id)

	const label = argv.newLabel ?? await stringInput('Enter new device label:')

	await outputItem(
		command,
		{ buildTableOutput: data => buildTableOutput(command.tableGenerator, data) },
		() => command.client.devices.update(id, { label }),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
