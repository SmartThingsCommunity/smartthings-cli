import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { buildEpilog } from '../../lib/help.js'
import {
	apiCommand,
	apiCommandBuilder,
	type APICommandFlags,
} from '../../lib/command/api-command.js'
import {
	formatAndWriteItem,
	formatAndWriteItemBuilder,
	type FormatAndWriteItemFlags,
} from '../../lib/command/format.js'
import { chooseDevice } from '../../lib/command/util/devices-choose.js'


export type CommandArgs =
	& APICommandFlags
	& FormatAndWriteItemFlags
	& {
		idOrIndex?: string
	}

const command = 'devices:health [id-or-index]'

const describe = 'get the current health status of a device'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	formatAndWriteItemBuilder(apiCommandBuilder(yargs))
		.positional('id-or-index', { describe: 'device id or number from list', type: 'string' })
		.example([
			['$0 devices:health', 'choose a device from a list and display its health status'],
			[
				'$0 devices:health 3',
				'display the health status for the third device listed when running "smartthings devices"',
			],
			[
				'$0 devices:health a13a3fbb-2b97-4c73-978d-ae7c2fca3ea8',
				'display the health status for the specified device',
			],
		])
		.epilog(buildEpilog({ command }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const deviceId = await chooseDevice(command, argv.idOrIndex, { allowIndex: true })
	const health = await command.client.devices.getHealth(deviceId)
	await formatAndWriteItem(command, { tableFieldDefinitions: ['deviceId', 'state', 'lastUpdatedDate'] }, health)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
