import { Flags } from '@oclif/core'

import { Device, DeviceIntegrationType, DeviceGetOptions, DeviceListOptions, DeviceStatus } from '@smartthings/core-sdk'

import {
	APICommand,
	outputItemOrList,
	OutputItemOrListConfig,
	TableFieldDefinition,
	withLocationAndRoom,
	withLocationsAndRooms,
	WithNamedRoom,
} from '@smartthings/cli-lib'

import { buildTableOutput } from '../lib/commands/devices-util.js'


export default class DevicesCommand extends APICommand<typeof DevicesCommand.flags> {
	static description = 'list all devices available in a user account or retrieve a single device' +
		this.apiDocsURL('getDevices', 'getDevice')

	static flags = {
		...APICommand.flags,
		...outputItemOrList.flags,
		location: Flags.string({
			char: 'l',
			description: 'filter results by location',
			multiple: true,
			helpValue: '<UUID>',
		}),
		capability: Flags.string({
			char: 'c',
			description: 'filter results by capability',
			multiple: true,
		}),
		// eslint-disable-next-line @typescript-eslint/naming-convention
		'capabilities-mode': Flags.string({
			char: 'C',
			description: 'Treat capability filter query params as a logical "or" or "and" with a default of "and".',
			dependsOn: ['capability'],
			options: ['and', 'or'],
		}),
		device: Flags.string({
			char: 'd',
			description: 'filter results by device',
			multiple: true,
			helpValue: '<UUID>',
		}),
		// eslint-disable-next-line @typescript-eslint/naming-convention
		'installed-app': Flags.string({
			char: 'a',
			description: 'filter results by installed app that created the device',
			helpValue: '<UUID>',
		}),
		status: Flags.boolean({
			char: 's',
			description: 'include attribute values in the response',
		}),
		health: Flags.boolean({
			char: 'H',
			description: 'include device health in response',
		}),
		type: Flags.string({
			description: 'filter results by device type',
			options: Object.values(DeviceIntegrationType),
			multiple: true,
		}),
		verbose: Flags.boolean({
			description: 'include location and room name in output',
			char: 'v',
		}),
	}

	static args = [{
		name: 'id',
		description: 'device to retrieve; UUID or the number of the device from list',
	}]

	async run(): Promise<void> {
		// type that includes extra fields sometimes included when requested via command line flags
		type OutputDevice = Device & WithNamedRoom & Pick<DeviceStatus, 'healthState'>

		const listTableFieldDefinitions: TableFieldDefinition<OutputDevice>[] = ['label', 'name', 'type', 'deviceId']

		if (this.flags.verbose) {
			listTableFieldDefinitions.splice(3, 0, 'location', 'room')
		}

		if (this.flags.health) {
			listTableFieldDefinitions.splice(3, 0, {
				path: 'healthState.state',
				label: 'Health',
			})
		}

		const config: OutputItemOrListConfig<OutputDevice> = {
			primaryKeyName: 'deviceId',
			sortKeyName: 'label',
			listTableFieldDefinitions,
			buildTableOutput: (data: Device) => buildTableOutput(this.tableGenerator, data),
		}

		const deviceGetOptions: DeviceGetOptions = {
			includeStatus: this.flags.status,
		}

		const deviceListOptions: DeviceListOptions = {
			capability: this.flags.capability,
			capabilitiesMode: this.flags['capabilities-mode'] === 'or' ? 'or' : 'and',
			locationId: this.flags.location,
			deviceId: this.flags.device,
			installedAppId: this.flags['installed-app'],
			type: this.flags.type as DeviceIntegrationType[] | undefined,
			includeHealth: this.flags.health,
			...deviceGetOptions,
		}

		await outputItemOrList(this, config, this.args.id,
			async () => {
				const devices = await this.client.devices.list(deviceListOptions)
				if (this.flags.verbose) {
					return await withLocationsAndRooms(this.client, devices)
				}
				return devices
			},
			async id => {
				let chosenDevice: OutputDevice = await this.client.devices.get(id, deviceGetOptions)
				if (this.flags.verbose) {
					chosenDevice = await withLocationAndRoom(this.client, chosenDevice)
				}
				// Note -- we have to do this explicitly because the API does not honor the includeHealth parameter
				// for individual devices
				if (this.flags.health) {
					const healthState = await this.client.devices.getHealth(id)
					chosenDevice = { ...chosenDevice, healthState }
				}
				return chosenDevice
			},
		)
	}
}
