import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type DeviceEvent, DeviceIntegrationType } from '@smartthings/core-sdk'

import { apiCommand, apiCommandBuilder, type APICommandFlags } from '../../lib/command/api-command.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemFlags,
} from '../../lib/command/input-and-output-item.js'
import { userInputProcessor } from '../../lib/command/input-processor.js'
import { chooseDeviceFn } from '../../lib/command/util/devices-choose.js'
import {
	getInputFromUser,
	type EventCreateFlags,
} from '../../lib/command/util/virtualdevices-events.js'
import { buildTableOutput, type EventInputOutput } from '../../lib/command/util/virtualdevices-events-table.js'


export type CommandArgs =
	& APICommandFlags
	& InputAndOutputItemFlags
	& EventCreateFlags

const command = 'virtualdevices:events [device-id] [name] [value] [unit]'

const describe = 'create events for a virtual device'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiCommandBuilder(yargs))
		.positional('id', { describe: 'the device id', type: 'string' })
		.positional(
			'name',
			{ describe: 'the fully qualified attribute name [<component>]:<capability>:<attribute>', type: 'string' },
		)
		.positional('value', { describe: 'the attribute value', type: 'string' })
		.positional('unit', { describe: 'optional unit of measure', type: 'string' })
		.example([
			['$0 virtualdevices:events', 'create an event in interactive mode'],
			[
				'$0 virtualdevices:events -i data.yaml',
				'create events from the definition in "data.yaml"',
			],
			[
				'$0 virtualdevices:events d26c8802-179d-443b-b3e6-2d35d76c1560 switch:switch on',
				'create an event, specifying all details on the command line',
			],
			[
				'$0 virtualdevices:events d26c8802-179d-443b-b3e6-2d35d76c1560 temperatureMeasurement:temperature 22.5 C',
				'create an event, specifying all details on the command line',
			],
		])
		.epilog('The command can be run interactively in question & answer mode, with command line parameters,' +
			' or with input from a file or standard in.')

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const deviceId = await chooseDeviceFn({ type: DeviceIntegrationType.VIRTUAL })(command, argv.deviceId)

	const createEvents = async (_: void, input: DeviceEvent[]): Promise<EventInputOutput[]> => {
		const output = await command.client.virtualDevices.createEvents(deviceId, input)
		return input.map((event, index) => ({ event, stateChange: output.stateChanges[index] }))
	}
	// TODO: This really should provide separate input processors for command line input and
	// user input rather than doing it all in `getInputFromUser`
	await inputAndOutputItem<DeviceEvent[], EventInputOutput[]>(
		command,
		{ buildTableOutput: (data: EventInputOutput[]) => buildTableOutput(command.tableGenerator, data) },
		createEvents,
		userInputProcessor(() => getInputFromUser(command, argv, deviceId)),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
