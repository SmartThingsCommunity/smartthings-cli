import { Flags } from '@oclif/core'

import { Device, DeviceIntegrationType, DeviceListOptions } from '@smartthings/core-sdk'

import { APICommand, outputListing, withLocationsAndRooms } from '@smartthings/cli-lib'

import { buildTableOutput } from '../lib/commands/devices/devices-util'


export default class DevicesCommand extends APICommand {
	static description = 'list all devices available in a user account or retrieve a single device'

	static flags = {
		...APICommand.flags,
		...outputListing.flags,
		'location-id': Flags.string({
			char: 'l',
			description: 'filter results by location',
			multiple: true,
		}),
		capability: Flags.string({
			char: 'c',
			description: 'filter results by capability',
			multiple: true,
		}),
		'capabilities-mode': Flags.string({
			char: 'C',
			description: 'Treat capability filter query params as a logical "or" or "and" with a default of "and".',
			dependsOn: ['capability'],
			options: ['and', 'or'],
		}),
		'device-id': Flags.string({
			char: 'd',
			description: 'filter results by device',
			multiple: true,
		}),
		'installed-app-id': Flags.string({
			char: 'a',
			description: 'filter results by installed app that created the device',
		}),
		type: Flags.string({
			description: 'filter results by device type',
			options: Object.values(DeviceIntegrationType),
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
		const { args, argv, flags } = await this.parse(DevicesCommand)
		await super.setup(args, argv, flags)

		const config = {
			primaryKeyName: 'deviceId',
			sortKeyName: 'label',
			listTableFieldDefinitions: ['label', 'name', 'type', 'deviceId'],
			buildTableOutput: (data: Device) => buildTableOutput(this.tableGenerator, data),
		}
		if (flags.verbose) {
			config.listTableFieldDefinitions.splice(3, 0, 'location', 'room')
		}

		const deviceListOptions: DeviceListOptions = {
			capability: flags.capability,
			capabilitiesMode: flags['capabilities-mode'] === 'or' ? 'or' : 'and',
			locationId: flags['location-id'],
			deviceId: flags['device-id'],
			installedAppId: flags['installed-app-id'],
			type: flags.type as DeviceIntegrationType | undefined,
		}

		await outputListing(this, config, args.id,
			async () => {
				const devices = await this.client.devices.list(deviceListOptions)
				if (flags.verbose) {
					return await withLocationsAndRooms(this.client, devices)
				}
				return devices
			},
			id => this.client.devices.get(id),
		)
	}
}
