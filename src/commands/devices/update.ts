import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type Device, type DeviceUpdate } from '@smartthings/core-sdk'

import { apiCommand, apiCommandBuilder, type APICommandFlags, apiDocsURL } from '../../lib/command/api-command.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemFlags,
} from '../../lib/command/input-and-output-item.js'
import { buildTableOutput } from '../../lib/command/util/devices-table.js'
import { chooseDevice } from '../../lib/command/util/devices-choose.js'


export type CommandArgs =
	& APICommandFlags
	& InputAndOutputItemFlags
	& {
		id?: string
	}

const command = 'devices:update [id]'

const describe = "update a device's label and room"

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiCommandBuilder(yargs))
		.positional('id', { describe: 'device id', type: 'string' })
		.example([
			[
				'$0 devices:update -i my-device.json',
				'prompt for a device and update it using the data in "my-device.json"',
			],
			[
				'$0 devices:update 392bcb11-e251-44f3-b58b-17f93015f3aa -i my-device.json',
				'update the device with the given id using the data in "my-device.json"',
			],
		])
		.epilog(apiDocsURL('updateDevice'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const id = await chooseDevice(command, argv.id)
	await inputAndOutputItem<DeviceUpdate, Device>(
		command,
		{ buildTableOutput: data => buildTableOutput(command.tableGenerator, data) },
		(_, data) => command.client.devices.update(id, data),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
