import { type ArgumentsCamelCase, type Argv, type CommandModule } from 'yargs'

import { type Device, type VirtualDeviceCreateRequest } from '@smartthings/core-sdk'

import { buildEpilog } from '../../lib/help.js'
import { fatalError } from '../../lib/util.js'
import {
	type APIOrganizationCommand,
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	type APIOrganizationCommandFlags,
} from '../../lib/command/api-organization-command.js'
import {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
	type InputAndOutputItemFlags,
} from '../../lib/command/input-and-output-item.js'
import { userInputProcessor } from '../../lib/command/input-processor.js'
import { buildTableOutput } from '../../lib/command/util/devices-table.js'
import { chooseDriver } from '../../lib/command/util/drivers-choose.js'
import { chooseHubFn } from '../../lib/command/util/hubs-choose.js'
import { chooseLocation } from '../../lib/command/util/locations-util.js'
import { chooseRoom } from '../../lib/command/util/rooms-choose.js'
import { chooseDeviceName, chooseDeviceProfileDefinition } from '../../lib/command/util/virtualdevices.js'


export type CommandArgs =
	& APIOrganizationCommandFlags
	& InputAndOutputItemFlags
	& {
		name?: string
		location?: string
		room?: string
		deviceProfile?: string
		deviceProfileFile?: string
		local: boolean
		hub?: string
		driver?: string
	}

const command = 'virtualdevices:create'

const describe = 'create a virtual device from a device profile id or definition'

const builder = (yargs: Argv): Argv<CommandArgs> =>
	inputAndOutputItemBuilder(apiOrganizationCommandBuilder(yargs))
		.option('name', { alias: 'N', describe: 'name of the device to be created', type: 'string' })
		.option('location', { alias: 'l', describe: 'location for the virtual device', type: 'string' })
		.option('room', { alias: 'R', describe: 'room for the virtual device', type: 'string' })
		.option('device-profile', { alias: 'P', describe: 'the device profile id', type: 'string' })
		.option(
			'local',
			{
				alias: 'L',
				describe: 'run device locally on a SmartThings hub; requires a hub and driver',
				type: 'boolean',
				default: false,
			},
		)
		.option('hub', { alias: 'H', describe: 'hub on which to run locally executing device', type: 'string' })
		.option('driver', { alias: 'D', describe: 'driver used for locally executing device', type: 'string' })
		.option(
			'device-profile-file',
			{ alias: 'f', describe: 'a file containing the device profile definition', type: 'string' },
		)
		.example([
			[
				'$0 virtualdevices:create',
				'create a virtual device by answering questions',
			],
			[
				'$0 virtualdevices:create -d',
				'generate JSON for a virtual device by answering questions but do not actually create it',
			],
			[
				'$0 virtualdevices:create -i data.yaml',
				'create a virtual device defined by the file data.yaml',
			],
			[
				'$0 virtualdevices:create -N "My Device" -i data.yaml',
				'create a virtual device defined by the file data.yaml but with the name "My Device"',
			],
			[
				'$0 virtualdevices:create -f profile.yaml',
				'create a virtual device with the specified profile, prompting for all remaining values',
			],
			[
				'$0 virtualdevices:create \\\n' +
					'  --name="My Second Device" \\\n' +
					'  --device-profile=7633ef68-6433-47ab-89c3-deb04b8b0d61 \\\n' +
					'  --location=95bdd473-4498-42fc-b932-974d6e5c236e \\\n' +
					'  --room=c7266cb7-7dcc-4958-8bc4-4288f5b50e1b',
				'create a virtual device using command line parameters for all values',
			],
		])
		.epilog(buildEpilog({
			command,
			notes: 'The command can be run interactively in question & answer mode, with command line parameters,' +
				' or with input from a file or standard in. You can also run this command multiple times with the same' +
				' input file but different command line arguments to create multiple devices with different names in' +
				' different locations and rooms.',
		}))

const mergeCreateFlagValues = (flags: CommandArgs, data: VirtualDeviceCreateRequest): VirtualDeviceCreateRequest => {
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

const getInputFromUser = async (command: APIOrganizationCommand<CommandArgs>): Promise<VirtualDeviceCreateRequest> => {
	const name = await chooseDeviceName(command.flags.name)
	const { deviceProfileId, deviceProfile } = await chooseDeviceProfileDefinition(command,
		command.flags.deviceProfile, command.flags.deviceProfileFile)
	const locationId = await chooseLocation(command, command.flags.location, { autoChoose: true })
	const [roomId] = await chooseRoom(command, command.flags.room, { autoChoose: true, locationId })
	const hubId = command.flags.local
		? await chooseHubFn({ locationId })(
			command,
			command.flags.hub,
			{ autoChoose: true, promptMessage: 'Select hub for local execution' },
		)
		: undefined
	const driverId = hubId
		? await chooseDriver(
			command,
			command.flags.driver,
			{ promptMessage: 'Select driver providing local execution' },
		)
		: undefined
	const executionTarget = command.flags.local
		? (hubId ? 'LOCAL' : 'CLOUD')
		: 'CLOUD'

	if (name && locationId && (deviceProfileId || deviceProfile)) {
		return {
			name,
			roomId,
			deviceProfileId,
			deviceProfile,
			executionTarget,
			hubId,
			driverId,
			owner: {
				ownerType: 'LOCATION',
				ownerId: locationId,
			},
		}
	}
	return fatalError('Incomplete device definition')
}

const handler = async (argv: ArgumentsCamelCase<CommandArgs>): Promise<void> => {
	const command = await apiOrganizationCommand(argv)

	const createDevice = async (_: void, data: VirtualDeviceCreateRequest): Promise<Device> =>
		command.client.virtualDevices.create(mergeCreateFlagValues(argv, data))

	await inputAndOutputItem(
		command,
		{
			buildTableOutput: (data: Device) => buildTableOutput(command.tableGenerator, data),
		},
		createDevice, userInputProcessor(() => getInputFromUser(command)),
	)
}

const cmd: CommandModule<object, CommandArgs> = { command, describe, builder, handler }
export default cmd
