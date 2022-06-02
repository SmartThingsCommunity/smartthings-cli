import { Flags } from '@oclif/core'
import inquirer from 'inquirer'
import {
	Device,
	DeviceIntegrationType,
	DeviceListOptions, DeviceProfile, DeviceProfileCreateRequest,
} from '@smartthings/core-sdk'
import {
	APICommand,
	APIOrganizationCommand,
	FileInputProcessor,
	outputListing,
	selectFromList,
	withLocationsAndRooms,
} from '@smartthings/cli-lib'
import { buildTableOutput } from '../../lib/commands/devices/devices-util'
import { chooseDeviceProfile } from '../deviceprofiles'
import {allPrototypes, locallyExecutingPrototypes} from './virtual/create-standard'


export async function chooseDeviceName(command: APICommand<typeof APICommand.flags>, preselectedName?: string): Promise<string | undefined> {
	if (!preselectedName) {
		preselectedName = (await inquirer.prompt({
			type: 'input',
			name: 'deviceName',
			message: 'Device Name:',
		})).deviceName
	}
	return preselectedName
}

export async function chooseRoom(command: APICommand<typeof APICommand.flags>, locationId: string, preselectedId?: string, autoChoose?: boolean): Promise<string> {
	const config = {
		itemName: 'room',
		primaryKeyName: 'roomId',
		sortKeyName: 'name',
	}
	return selectFromList(command, config, {
		preselectedId,
		autoChoose,
		listItems: () => command.client.rooms.list(locationId),
	})
}

export interface DeviceProfileDefinition {
	deviceProfileId?: string
	deviceProfile?: DeviceProfileCreateRequest
}

export async function chooseDeviceProfileDefinition(command: APIOrganizationCommand<typeof APIOrganizationCommand.flags>, deviceProfileId?: string, deviceProfileFile?: string): Promise<DeviceProfileDefinition> {
	let deviceProfile

	if (deviceProfileFile) {
		const inputProcessor = new FileInputProcessor<DeviceProfile>(deviceProfileFile)
		deviceProfile = await inputProcessor.read()
	} else if (!deviceProfileId) {
		deviceProfileId = await chooseDeviceProfile(command, deviceProfileId, {allowIndex: true})
	}

	return {deviceProfileId, deviceProfile}
}

export async function chooseDevicePrototype(command: APICommand<typeof APICommand.flags>, preselectedId?: string): Promise<string> {
	const config = {
		itemName: 'device prototype',
		primaryKeyName: 'id',
		sortKeyName: 'name',
	}
	let prototype = await selectFromList(command, config, {
		preselectedId,
		listItems: () => Promise.resolve(locallyExecutingPrototypes),
	})

	if (prototype === 'more') {
		prototype = await selectFromList(command, config, {
			listItems: () => Promise.resolve(allPrototypes),
		})
	}

	return prototype
}

export default class VirtualDevicesCommand extends APICommand<typeof VirtualDevicesCommand.flags> {
	static description = 'list all devices available in a user account or retrieve a single device'

	static flags = {
		...APICommand.flags,
		...outputListing.flags,
		'location-id': Flags.string({
			char: 'l',
			description: 'filter results by location',
			multiple: true,
		}),
		'installed-app-id': Flags.string({
			char: 'a',
			description: 'filter results by installed app that created the device',
		}),
		verbose: Flags.boolean({
			description: 'include location name in output',
			char: 'v',
		}),
	}

	static args = [{
		name: 'id',
		description: 'device to retrieve; UUID or the number of the device from list',
	}]

	async run(): Promise<void> {
		const config = {
			primaryKeyName: 'deviceId',
			sortKeyName: 'label',
			listTableFieldDefinitions: ['label', 'deviceId'],
			buildTableOutput: (data: Device) => buildTableOutput(this.tableGenerator, data),
		}
		if (this.flags.verbose) {
			config.listTableFieldDefinitions.splice(3, 0, 'location', 'room')
		}

		const deviceListOptions: DeviceListOptions = {
			locationId: this.flags['location-id'],
			installedAppId: this.flags['installed-app-id'],
			type: DeviceIntegrationType.VIRTUAL,
		}

		await outputListing(this, config, this.args.id,
			async () => {
				const devices = await this.client.devices.list(deviceListOptions)
				if (this.flags.verbose) {
					return await withLocationsAndRooms(this.client, devices)
				}
				return devices
			},
			id => this.client.devices.get(id),
		)
	}
}
