import { Flags } from '@oclif/core'
import {
	Device,
	DeviceIntegrationType,
	DeviceListOptions,
} from '@smartthings/core-sdk'
import {
	APICommand,
	outputListing,
	withLocationsAndRooms,
} from '@smartthings/cli-lib'
import { buildTableOutput } from '../lib/commands/devices-util'


export default class VirtualDevicesCommand extends APICommand<typeof VirtualDevicesCommand.flags> {
	static description = 'list all virtual devices available in a user account or retrieve a single device'

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
