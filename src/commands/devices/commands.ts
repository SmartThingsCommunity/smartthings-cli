import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { Command } from '@smartthings/core-sdk'

import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../../lib/command/api-command.js'
import { buildEpilog } from '../../lib/help.js'
import { inputItem, inputItemBuilder, type InputItemFlags } from '../../lib/command/input-item.js'
import { chooseDevice } from '../../lib/command/util/devices-choose.js'
import { commandLineInputProcessor, userInputProcessor } from '../../lib/command/input-processor.js'
import { getInputFromUser, parseDeviceCommand } from '../../lib/command/util/devices-commands.js'


export type CommandArgs =
	& APICommandFlags
	& InputItemFlags
	& {
		id?: string
		command?: string
	}

const command = 'devices:commands [id] [command]'

const describe = 'execute a device command'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputItemBuilder(apiCommandBuilder(yargs))
		.positional('id', { describe: 'the device id', type: 'string' })
		.positional(
			'command',
			{ describe: 'the command [<component>]:<capability>:<command>([<arguments>])', type: 'string' },
		)
		.example([
			['$0 devices:commands', 'prompt for a device and details of the command to send'],
			[
				'$0 devices:commands 82532e8c-e35b-4fa8-b45f-58a083e5f3d2 switch:off',
				'send the "off" command for the "switch" capability to the specified device',
			],
			[
				'$0 devices:commands 6d73e4d1-3278-44d4-915a-099a62f05330 \'switchLevel:setLevel(50)\'',
				'send the "setLevel" command, passing 50 as an argument, for the "switchLevel" capability to the' +
					' specified device (note: quotes prevent shell parsing errors)',
			],
		])
		.epilog(buildEpilog({ command, apiDocs: ['executeDeviceCommands'] }))

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const deviceId = await chooseDevice(command, argv.id)

	const [commands] = await inputItem<Command>(
		argv,
		commandLineInputProcessor({
			hasCommandLineInput: () => !!argv.command,
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			getInputFromCommandLine: async () => parseDeviceCommand(argv.command!),
		}),
		userInputProcessor(() => getInputFromUser(command, deviceId)),
	)

	await command.client.devices.executeCommands(deviceId, [commands])
	console.log('Command executed successfully')
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
