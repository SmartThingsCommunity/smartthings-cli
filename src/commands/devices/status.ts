import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type APICommandFlags, apiCommand, apiCommandBuilder, apiDocsURL } from '../../lib/command/api-command.js'
import { type FormatAndWriteItemFlags, formatAndWriteItem, formatAndWriteItemBuilder } from '../../lib/command/format.js'
import { chooseDevice } from '../../lib/command/util/devices-choose.js'
import { buildStatusTableOutput } from '../../lib/command/util/devices-table.js'


export type CommandArgs =
	& APICommandFlags
	& FormatAndWriteItemFlags
	& {
		idOrIndex?: string
	}

const command = 'devices:status [id-or-index]'

const describe = "get the current status of all of a device's component's attributes"

const builder = (yargs: Argv): Argv<CommandArgs> =>
	formatAndWriteItemBuilder(apiCommandBuilder(yargs))
		.positional('id-or-index', { describe: 'the device id or number in list', type: 'string' })
		.example([
			['$0 devices:status', 'prompt for a device and display its component\'s attributes'],
			['$0 devices:status 3', 'display component attributes for third device listed in output of devices command'],
			['$0 devices:status eee23fb0-38cd-4f07-be6d-dec9000b41fe', 'display component attributes for device by id'],
		])
		.epilog(apiDocsURL('getDeviceStatus'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const deviceId = await chooseDevice(command, argv.idOrIndex, { allowIndex: true })
	const presentation = await command.client.devices.getStatus(deviceId)
	await formatAndWriteItem(
		command,
		{ buildTableOutput: data => buildStatusTableOutput(command.tableGenerator, data) },
		presentation,
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
