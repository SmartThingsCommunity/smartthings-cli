import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { DeviceIntegrationType } from '@smartthings/core-sdk'

import { type APICommandFlags, apiCommand, apiCommandBuilder } from '../../lib/command/api-command.js'
import { chooseDeviceFn } from '../../lib/command/util/devices-choose.js'


export type CommandArgs = APICommandFlags & {
	id?: string
}

export const command = 'virtualdevices:delete [id]'

const describe = 'delete a virtual device'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiCommandBuilder(yargs)
		.positional('id', { describe: 'device id', type: 'string' })
		.example([
			['$0 virtualdevices:delete', 'choose the device to delete from a list'],
			[
				'$0 virtualdevices:delete 43daec4d-f2c6-4bc3-9df7-50ed1012c137',
				'delete the device with the specified id',
			],
		])

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const id = await chooseDeviceFn({ type: DeviceIntegrationType.VIRTUAL })(command, argv.id)
	await command.client.devices.delete(id)
	console.log(`Device ${id} deleted.`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
