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
import { buildTableOutput } from '../../lib/commands/devices-util'

import { chooseLocation } from '../locations'
import { chooseDeviceName, chooseDeviceProfileDefinition } from '../../lib/commands/virtualdevices-util'
import { chooseRoom } from '../../lib/commands/locations/rooms-util'
import { chooseDriver, chooseHub } from '../../lib/commands/hubs-util'


export default class VirtualDeviceCreateCommand extends APIOrganizationCommand<typeof VirtualDeviceCreateCommand.flags> {
	static description = 'create a virtual device from a device profile ID or definition\n' +
		'The command can be run interactively in question & answer mode, with command line parameters, ' +
		'or with input from a file or standard in. You can also run this command multiple times with the same input ' +
		'file but different command line arguments to create multiple devices with different names in different ' +
		'locations and rooms.'

	static examples = [
		'$ smartthings virtualdevices:create                            # interactive mode',
		'$ smartthings virtualdevices:create -i data.yml                # using request body from a YAML file',
		'$ smartthings virtualdevices:create -N "My Device" -i data.yml # using file request body with "My Device" for the name',
		'$ smartthings virtualdevices:create \\                          # using command line parameters for everything\n' +
		'>    --name="My Second Device" \\ \n' +
		'>    --device-profile=7633ef68-6433-47ab-89c3-deb04b8b0d61 \\ \n' +
		'>    --location=95bdd473-4498-42fc-b932-974d6e5c236e \\ \n' +
		'>    --room=c7266cb7-7dcc-4958-8bc4-4288f5b50e1b',
		'$ smartthings virtualdevices:create -f profile.yml             # using a device profile and prompting for the remaining values',
	]

	static flags = {
		...APIOrganizationCommand.flags,
		...inputAndOutputItem.flags,
		name: Flags.string({
			char: 'N',
			description: 'name of the device to be created',
		}),
		location: Flags.string({
			char: 'l',
			description: 'location into which device should be created',
			helpValue: '<UUID>',
		}),
		room: Flags.string({
			char: 'R',
			description: 'the room to put the device into',
			helpValue: '<UUID>',
		}),
		/* eslint-disable @typescript-eslint/naming-convention */
		'device-profile': Flags.string({
			char: 'P',
			description: 'the device profile ID',
			helpValue: '<UUID>',
		}),
		'device-profile-file': Flags.string({
			char: 'f',
			description: 'a file containing the device profile definition',
		}),
		/* eslint-enable @typescript-eslint/naming-convention */
		local: Flags.boolean({
			char: 'L',
			description: 'run this device locally on a SmartThings hub. Requires a hub and driver',
		}),
		hub: Flags.string({
			char: 'H',
			description: 'hub on which to run locally executing device',
			helpValue: '<UUID>',
		}),
		driver: Flags.string({
			char: 'D',
			description: 'driver used for locally executing device',
			helpValue: '<UUID>',
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

	private mergeCreateFlagValues(flags: InferredFlagsType<typeof VirtualDeviceCreateCommand.flags>, data: VirtualDeviceCreateRequest): VirtualDeviceCreateRequest {
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

	async getInputFromUser(): Promise<VirtualDeviceCreateRequest> {
		const name = await chooseDeviceName(this, this.flags.name)
		const { deviceProfileId, deviceProfile } = await chooseDeviceProfileDefinition(this,
			this.flags['device-profile'], this.flags['device-profile-file'])
		const locationId = await chooseLocation(this, this.flags.location, true)
		const [roomId] = await chooseRoom(this, locationId, this.flags.room, true)
		const hubId = this.flags.local
			? await chooseHub(this, 'Select hub for local execution', locationId, this.flags.hub, true)
			: undefined
		const driverId = hubId
			? await chooseDriver(this, 'Select driver providing local execution', this.flags.driver)
			: undefined
		const executionTarget = this.flags.local
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
		} else {
			this.error('Incomplete device definition')
		}
	}
}
