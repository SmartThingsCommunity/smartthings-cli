import { Flags } from '@oclif/core'
import {
	Device,
	VirtualDeviceStandardCreateRequest,
} from '@smartthings/core-sdk'
import {
	APICommand,
	InferredFlagsType,
	inputAndOutputItem,
	userInputProcessor,
} from '@smartthings/cli-lib'
import { buildTableOutput } from '../../lib/commands/devices-util.js'
import { chooseLocation } from '../locations.js'
import {
	chooseDeviceName,
	chooseDevicePrototype,
	chooseLocallyExecutingDevicePrototype,
} from '../../lib/commands/virtualdevices-util.js'
import { chooseRoom } from '../../lib/commands/locations/rooms-util.js'
import { chooseHub } from '../../lib/commands/hubs-util.js'


export default class VirtualDeviceCreateStandardCommand extends APICommand<typeof VirtualDeviceCreateStandardCommand.flags> {
	static description = 'create a device from one of the standard prototypes.\n' +
		'The command can be run interactively in question & answer mode, with command line parameters, ' +
		'or with input from a file or standard in. You can also run this command multiple times with the same input ' +
		'file but different command line arguments to create multiple devices with different names in different ' +
		'locations and rooms.'

	static examples = [
		'$ smartthings virtualdevices:create-standard                            # interactive mode',
		'$ smartthings virtualdevices:create-standard -i data.yml                # using request body from a YAML file',
		'$ smartthings virtualdevices:create-standard -N "My Device" -i data.yml # using file request body with "My Device" for the name',
		'$ smartthings virtualdevices:create-standard \\                          # using command line parameters for everything\n' +
		'>    --name="My Second Device" \\ \n' +
		'>    --prototype=VIRTUAL_SWITCH \\ \n' +
		'>    --location=95bdd473-4498-42fc-b932-974d6e5c236e \\ \n' +
		'>    --room=c7266cb7-7dcc-4958-8bc4-4288f5b50e1b',
	]

	static flags = {
		...APICommand.flags,
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
		prototype: Flags.string({
			char: 'T',
			description: 'standard device prototype, e.g. VIRTUAL_SWITCH or VIRTUAL_DIMMER_SWITCH',
		}),
		local: Flags.boolean({
			char: 'L',
			description: 'run this device locally on a SmartThings hub',
		}),
		hub: Flags.string({
			char: 'H',
			description: 'hub on which to run locally executing device',
			helpValue: '<UUID>',
		}),
	}

	async run(): Promise<void> {
		const createDevice = async (_: void, data: VirtualDeviceStandardCreateRequest): Promise<Device> => {
			return this.client.virtualDevices.createStandard(this.mergeCreateFlagValues(this.flags, data))
		}

		await inputAndOutputItem(this,
			{
				buildTableOutput: (data: Device) => buildTableOutput(this.tableGenerator, data),
			},
			createDevice, userInputProcessor(this))
	}

	private mergeCreateFlagValues(flags: InferredFlagsType<typeof VirtualDeviceCreateStandardCommand.flags>, data: VirtualDeviceStandardCreateRequest): VirtualDeviceStandardCreateRequest {
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

	async getInputFromUser(): Promise<VirtualDeviceStandardCreateRequest> {
		const name = await chooseDeviceName(this, this.flags.name)
		const locationId = await chooseLocation(this, this.flags.location, true)
		const [roomId] = await chooseRoom(this, locationId, this.flags.room, true)
		const prototype = this.flags.local
			? await chooseLocallyExecutingDevicePrototype(this, this.flags['prototype'])
			: await chooseDevicePrototype(this, this.flags['prototype'])
		const hubId = this.flags.local
			? await chooseHub(this, 'Select hub for local execution', locationId, this.flags.hub, true)
			: undefined
		const executionTarget = this.flags.local
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
		} else {
			this.error('Incomplete prototype definition')
		}
	}
}
