import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type Device, DeviceIntegrationType, type DeviceUpdate } from '@smartthings/core-sdk'

import {
	type APICommandFlags,
	apiCommand,
	apiCommandBuilder,
	apiDocsURL,
} from '../../lib/command/api-command.js'
import {
	type InputAndOutputItemFlags,
	inputAndOutputItem,
	inputAndOutputItemBuilder,
} from '../../lib/command/input-and-output-item.js'
import { chooseDeviceFn } from '../../lib/command/util/devices-choose.js'
import { buildTableOutput } from '../../lib/command/util/devices-table.js'


export type CommandArgs =
	& APICommandFlags
	& InputAndOutputItemFlags
	& {
		id?: string
	}

const command = 'virtualdevices:update [id]'

const describe = "update a virtual device's label and room"

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiCommandBuilder(yargs))
		.positional('id', { describe: 'the device id', type: 'string' })
		.example([
			[
				'$0 virtualdevices:update -i my-virtualdevice.yaml',
				'prompt for a virtual device and update it using the data in "my-virtualdevice.yaml"',
			],
			[
				'$0 virtualdevices:update 392bcb11-e251-44f3-b58b-17f93015f3aa -i my-virtualdevice.json',
				'update the virtual device with the given id using the data in "my-virtualdevice.json"',
			],
		])
		.epilog(apiDocsURL('updateDevice'))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const id = await chooseDeviceFn({ type: DeviceIntegrationType.VIRTUAL })(command, argv.id)
	await inputAndOutputItem<DeviceUpdate, Device>(
		command,
		{ buildTableOutput: data => buildTableOutput(command.tableGenerator, data) },
		(_, data) => command.client.devices.update(id, data),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
