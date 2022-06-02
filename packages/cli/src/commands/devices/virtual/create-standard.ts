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
import { buildTableOutput } from '../../../lib/commands/devices/devices-util'
import { chooseLocation } from '../../locations'
import { chooseDeviceName, chooseDevicePrototype, chooseRoom } from '../virtual'


export const locallyExecutingPrototypes = [
	{name: 'Switch', id: 'VIRTUAL_SWITCH'},
	{name: 'Dimmer', id: 'VIRTUAL_DIMMER_SWITCH'},
	{name: 'Testing devices...', id: 'more'},
]

export const allPrototypes = [
	{name: 'Switch', id: 'VIRTUAL_SWITCH'},
	{name: 'Dimmer (only)', id: 'VIRTUAL_DIMMER'},
	{name: 'Dimmer Switch', id: 'VIRTUAL_DIMMER_SWITCH'},
	{name: 'Camera', id: 'VIRTUAL_CAMERA'},
	{name: 'Color Bulb', id: 'VIRTUAL_COLOR_BULB'},
	{name: 'Metered Switch', id: 'VIRTUAL_METERED_SWITCH'},
	{name: 'Motion Sensor', id: 'VIRTUAL_MOTION_SENSOR'},
	{name: 'Multi-Sensor', id: 'VIRTUAL_MULTI_SENSOR'},
	{name: 'Refrigerator', id: 'VIRTUAL_REFRIGERATOR'},
	{name: 'RGBW Bulb', id: 'VIRTUAL_RGBW_BULB'},
	{name: 'Button', id: 'VIRTUAL_BUTTON'},
	{name: 'Presence Sensor', id: 'VIRTUAL_PRESENCE_SENSOR'},
	{name: 'Contact Sensor', id: 'VIRTUAL_CONTACT_SENSOR'},
	{name: 'Garage Door Opener', id: 'VIRTUAL_GARAGE_DOOR_OPENER'},
	{name: 'Thermostat', id: 'VIRTUAL_THERMOSTAT'},
	{name: 'Lock', id: 'VIRTUAL_LOCK'},
	{name: 'Siren', id: 'VIRTUAL_SIREN'},
]

export default class VirtualDeviceCreateStandardCommand extends APICommand<typeof VirtualDeviceCreateStandardCommand.flags> {
	static description = 'create a virtual device from a standard prototype'

	static examples = [
		'$ smartthings devices:virtual:create-standard                            # interactive mode',
		'$ smartthings devices:virtual:create-standard -i data.yml                # using request body from a YAML file',
		'$ smartthings devices:virtual:create-standard -N "My Device" -i data.yml # using file request body with "My Device" for the name',
		'$ smartthings devices:virtual:create-standard \\                          # using command line parameters for everything\n' +
		'>    --name="My Second Device" \\ \n' +
		'>    --prototype=VIRTUAL_SWITCH \\ \n' +
		'>    --location-id=95bdd473-4498-42fc-b932-974d6e5c236e \\ \n' +
		'>    --room-id=c7266cb7-7dcc-4958-8bc4-4288f5b50e1b',
	]

	static flags = {
		...APICommand.flags,
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
		prototype: Flags.string({
			char: 'T',
			description: 'standard device prototype, e.g. VIRTUAL_SWITCH or VIRTUAL_DIMMER_SWITCH',
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

	mergeCreateFlagValues(flags: InferredFlagsType<typeof VirtualDeviceCreateStandardCommand.flags>, data: VirtualDeviceStandardCreateRequest) : VirtualDeviceStandardCreateRequest {
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

	async getInputFromUser(): Promise<VirtualDeviceStandardCreateRequest> {
		const name = await chooseDeviceName(this, this.flags.name)
		const prototype = await chooseDevicePrototype(this, this.flags['prototype'])
		const locationId = await chooseLocation(this, this.flags['location-id'], true)
		const roomId = await chooseRoom(this, locationId, this.flags['room-id'], true)

		if (name && prototype && locationId) {
			return {
				name,
				roomId,
				prototype,
				owner: {
					ownerType: 'LOCATION',
					ownerId: locationId,
				},
			} as VirtualDeviceStandardCreateRequest
		} else {
			throw new Error('Incomplete prototype definition')
		}
	}
}
