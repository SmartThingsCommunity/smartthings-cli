import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import {
	apiCommand,
	apiCommandBuilder,
	apiDocsURL,
	type APICommandFlags,
} from '../../lib/command/api-command.js'
import {
	formatAndWriteItem,
	formatAndWriteItemBuilder,
	type FormatAndWriteItemFlags,
} from '../../lib/command/format.js'
import { chooseComponentFn, chooseDevice } from '../../lib/command/util/devices-choose.js'
import { buildComponentStatusTableOutput } from '../../lib/command/util/devices-table.js'


export type CommandArgs =
	& APICommandFlags
	& FormatAndWriteItemFlags
	& {
		deviceIdOrIndex?: string
		componentId?: string
	}

const command = 'devices:component-status [device-id-or-index] [component-id]'

const describe = "get the current status of a device component's attributes"

const builder = (yargs: Argv): Argv<CommandArgs> =>
	formatAndWriteItemBuilder(apiCommandBuilder(yargs))
		.positional('device-id-or-index',
			{ describe: 'device id or index in list from devices command', type: 'string' })
		.positional('component-id', { describe: 'component id', type: 'string' })
		.example([
			['$0 devices:capability-status',
				'prompt for a device and component and display its status'],
			['$0 devices:capability-status fa1eb54c-c571-405f-8817-ffb7cd2f5a9d',
				'prompt for a component for the specified device and display its status'],
			['$0 devices:capability-status 12',
				'prompt for a component for the twelfth device found when running "smartthings devices"' +
				' and display its status'],
			['$0 devices:capability-status fa1eb54c-c571-405f-8817-ffb7cd2f5a9d main',
				'display the status for the specified device and component'],
		])
		.epilog(apiDocsURL('getDeviceComponentStatus'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const deviceId = await chooseDevice(command, argv.deviceIdOrIndex, { allowIndex: true })

	const device = await command.client.devices.get(deviceId)
	const componentName = await chooseComponentFn(device)(
		command,
		argv.componentId,
		{ autoChoose: true, allowIndex: true },
	)

	const componentStatus = await command.client.devices.getComponentStatus(deviceId, componentName)
	await formatAndWriteItem(
		command,
		{ buildTableOutput: data => buildComponentStatusTableOutput(command.tableGenerator, data) },
		componentStatus,
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
