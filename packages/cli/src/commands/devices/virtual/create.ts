import { Flags } from '@oclif/core'
import {
	Device,
	VirtualDeviceCreateRequest,
} from '@smartthings/core-sdk'
import {
	APIOrganizationCommand,
	InferredFlagsType,
	inputAndOutputItem,
	userInputProcessor,
} from '@smartthings/cli-lib'
import { buildTableOutput } from '../../../lib/commands/devices/devices-util'

import { chooseLocation } from '../../locations'
import { chooseDeviceName, chooseDeviceProfileDefinition, chooseRoom } from '../virtual'


export default class VirtualDeviceCreateCommand extends APIOrganizationCommand<typeof VirtualDeviceCreateCommand.flags> {
	static description = 'Creates a virtual device from a device profile ID or definition\n' +
		'The command can be run interactively, in question & answer mode, with command line parameters,\n' +
		'or with input from a file or standard in. You can also combine command line input with file input\n' +
		'so that you can create multiple devices with different names in different locations and rooms using\n' +
		'the same input file.'

	static examples = [
		'$ smartthings devices:virtual:create                            # interactive mode',
		'$ smartthings devices:virtual:create -i data.yml                # using request body from a YAML file',
		'$ smartthings devices:virtual:create -N "My Device" -i data.yml # using file request body with "My Device" for the name',
		'$ smartthings devices:virtual:create \\                          # using command line parameters for everything\n' +
		'>    --name="My Second Device" \\ \n' +
		'>    --device-profile-id=7633ef68-6433-47ab-89c3-deb04b8b0d61 \\ \n' +
		'>    --location-id=95bdd473-4498-42fc-b932-974d6e5c236e \\ \n' +
		'>    --room-id=c7266cb7-7dcc-4958-8bc4-4288f5b50e1b',
		'$ smartthings devices:virtual:create -f profile.yml             # using a device profile and prompting for the remaining values',
	]

	static flags = {
		...APIOrganizationCommand.flags,
		...inputAndOutputItem.flags,
		name: Flags.string({
			char: 'N',
			description: 'name of the device to be created',
		}),
		'location-id': Flags.string({
			char: 'l',
			description: 'location into which device should be created',
		}),
		'room-id': Flags.string({
			char: 'R',
			description: 'the room to put the device into',
		}),
		'device-profile-id': Flags.string({
			char: 'P',
			description: 'the device profile ID',
		}),
		'device-profile-file': Flags.string({
			char: 'f',
			description: 'a file containing the device profile definition',
		}),
	}

	async run(): Promise<void> {
		const createDevice = async (_: void, data: VirtualDeviceCreateRequest): Promise<Device> => {
			return this.client.virtualDevices.create(this.mergeCreateFlagValues(this.flags, data))
		}

		await inputAndOutputItem(this,
			{
				buildTableOutput: (data: Device) => buildTableOutput(this.tableGenerator, data),
			},
			createDevice, userInputProcessor(this))
	}

	mergeCreateFlagValues(flags: InferredFlagsType<typeof VirtualDeviceCreateCommand.flags>, data: VirtualDeviceCreateRequest) : VirtualDeviceCreateRequest {

		if (flags.name) {
			data.name = flags.name
		}
		if (flags['location-id']) {
			data.owner.ownerId = flags['location-id']
		}
		if (flags['room-id']) {
			data.roomId = flags['room-id']
		}
		return data
	}

	async getInputFromUser(): Promise<VirtualDeviceCreateRequest> {
		const name = await chooseDeviceName(this, this.flags.name)
		const {deviceProfileId, deviceProfile} = await chooseDeviceProfileDefinition(this,
			this.flags['device-profile-id'], this.flags['device-profile-file'])
		const locationId = await chooseLocation(this, this.flags['location-id'], true)
		const roomId = await chooseRoom(this, locationId, this.flags['room-id'], true)

		if (name && locationId && (deviceProfileId || deviceProfile)) {
			return {
				name,
				roomId,
				deviceProfileId,
				deviceProfile,
				owner: {
					ownerType: 'LOCATION',
					ownerId: locationId,
				},
			} as VirtualDeviceCreateRequest
		} else {
			throw new Error('Incomplete device definition')
		}
	}
}
