import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type Device, type VirtualDeviceStandardCreateRequest } from '@smartthings/core-sdk'

import { buildEpilog } from '../../lib/help.js'
import { fatalError } from '../../lib/util.js'
import { apiCommand, type APICommand, apiCommandBuilder, type APICommandFlags } from '../../lib/command/api-command.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemFlags,
} from '../../lib/command/input-and-output-item.js'
import { userInputProcessor } from '../../lib/command/input-processor.js'
import { buildTableOutput } from '../../lib/command/util/devices-table.js'
import { chooseHubFn } from '../../lib/command/util/hubs-choose.js'
import { chooseLocation } from '../../lib/command/util/locations-util.js'
import { chooseRoom } from '../../lib/command/util/rooms-choose.js'
import {
	chooseDeviceName,
	chooseDevicePrototype,
	chooseLocallyExecutingDevicePrototype,
} from '../../lib/command/util/virtualdevices.js'


export type CommandArgs =
	& APICommandFlags
	& InputAndOutputItemFlags
	& {
		name?: string
		location?: string
		room?: string
		prototype?: string
		local?: string
		hub?: string
	}

const command = 'virtualdevices:create-standard'

const describe = 'create a virtual device from one of the standard prototypes'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiCommandBuilder(yargs))
		.option('name', { alias: 'N', describe: 'name of the device to be created', type: 'string' })
		.option('location', { alias: 'l', describe: 'location into which device should be created', type: 'string' })
		.option('room', { alias: 'R', describe: 'the room to put the device into', type: 'string' })
		.option('prototype', { alias: 'T', describe: 'standard device prototype, e.g. VIRTUAL_SWITCH or VIRTUAL_DIMMER_SWITCH', type: 'string' })
		.option('local', { alias: 'L', describe: 'run this device locally on a SmartThings hub', type: 'string' })
		.option('hub', { alias: 'H', describe: 'hub on which to run locally executing device', type: 'string' })
		.example([
			['$0 virtualdevices:create-standard', 'create a virtual device in interactive mode'],
			[
				'$0 virtualdevices:create-standard -i data.yaml',
				'create a virtual device from the definition in "data.yaml"',
			],
			[
				'$0 virtualdevices:create-standard --dry-run --output standard-device.yaml',
				'use interactive mode to generate a YAML file which can be used later as input' +
					'; can be used with command line overrides as shown in the following example',
			],
			[
				'$0 virtualdevices:create-standard -N "My Device" -i data.yaml',
				'create a virtual device from the definition in "data.yaml" with "My Device" for the name',
			],
			[
				'$0 virtualdevices:create-standard' +
					' --name="My Second Device"' +
					' --prototype=VIRTUAL_SWITCH' +
					' --location=95bdd473-4498-42fc-b932-974d6e5c236e' +
					' --room=c7266cb7-7dcc-4958-8bc4-4288f5b50e1b',
				'create a virtual device, specifying all details on the command line',
			],
		])
		.epilog(buildEpilog({
			command,
			notes: 'The command can be run interactively in question & answer mode, with command line parameters,' +
				' or with input from a file or standard in. You can also run this command multiple times with the' +
				' same input file but different command line arguments to create multiple devices with different' +
				' names in different locations and rooms.',
		}))

const mergeCreateFlagValues = (flags: CommandArgs, data: VirtualDeviceStandardCreateRequest): VirtualDeviceStandardCreateRequest => {
	if (flags.name) {
		data.name = flags.name
	}
	if (flags.location) {
		data.owner.ownerId = flags.location
	}
	if (flags.room) {
		data.roomId = flags.room
	}
	return data
}

const getInputFromUser = async (command: APICommand, flags: CommandArgs): Promise<VirtualDeviceStandardCreateRequest> => {
	const name = await chooseDeviceName(flags.name)
	const locationId = await chooseLocation(command, flags.location, { autoChoose: true })
	const [roomId] = await chooseRoom(command, flags.room, { locationId, autoChoose: true })
	const prototype = flags.local
		? await chooseLocallyExecutingDevicePrototype(command, flags.prototype)
		: await chooseDevicePrototype(command, flags.prototype)
	const hubId = flags.local
		? await chooseHubFn({ locationId })(command, flags.hub, { autoChoose: true, promptMessage: 'Select hub for local execution' })
		: undefined
	const executionTarget = flags.local
		? (hubId ? 'LOCAL' : 'CLOUD')
		: 'CLOUD'

	if (name && prototype && locationId) {
		return {
			name,
			roomId,
			prototype,
			hubId,
			executionTarget,
			owner: {
				ownerType: 'LOCATION',
				ownerId: locationId,
			},
		}
	}
	return fatalError('Incomplete prototype definition')
}

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiCommand(argv)

	const createDevice = async (_: void, data: VirtualDeviceStandardCreateRequest): Promise<Device> => {
		return command.client.virtualDevices.createStandard(mergeCreateFlagValues(argv, data))
	}

	await inputAndOutputItem(command,
		{
			buildTableOutput: (data: Device) => buildTableOutput(command.tableGenerator, data),
		},
		createDevice, userInputProcessor(() => getInputFromUser(command, argv)))
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
