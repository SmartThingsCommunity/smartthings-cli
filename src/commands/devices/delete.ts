import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import {
	type APICommandFlags,
	apiCommand,
	apiCommandBuilder,
} from '../../lib/command/api-command.js'
import { buildEpilog } from '../../lib/help.js'
import { chooseDevice } from '../../lib/command/util/devices-choose.js'


export type CommandArgs = APICommandFlags & {
	id?: string
}

export const command = 'devices:delete [id]'

const describe = 'delete a device'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	apiCommandBuilder(yargs)
		.positional('id', { describe: 'device id', type: 'string' })
		.example([
			['$0 devices:delete', 'choose the device to delete from a list'],
			[
				'$0 devices:delete 43daec4d-f2c6-4bc3-9df7-50ed1012c137',
				'delete the device with the specified id',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: ['deleteDevice'] }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const id = await chooseDevice(command, argv.id)
	await command.client.devices.delete(id)
	console.log(`Device ${id} deleted.`)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
