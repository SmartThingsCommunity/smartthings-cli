import { flags } from '@oclif/command'

import { Device, DeviceListOptions } from '@smartthings/core-sdk'

import { APICommand, ListingOutputAPICommand, withLocationsAndRooms } from '@smartthings/cli-lib'


export type DeviceWithLocation = Device & { location?: string }

export function buildTableOutput(this: APICommand, data: Device & { profileId?: string }): string {
	const table = this.tableGenerator.newOutputTable()
	table.push(['Name', data.name])
	table.push(['Id', data.deviceId])
	table.push(['Label', data.label])
	table.push(['Manufacturer Code', data.deviceManufacturerCode ?? ''])
	table.push(['Location Id', data.locationId ?? ''])
	table.push(['Room Id', data.roomId ?? ''])
	table.push(['Device Type Id', data.deviceTypeId ?? ''])
	for (const comp of data.components ?? []) {
		table.push([`${comp.id} component`,  comp.capabilities ? comp.capabilities.map(it => it.id).join('\n') : ''])
	}
	table.push(['Child Devices',  data.childDevices ? data.childDevices.map(it => it.deviceId).join('\n') : ''  ])
	table.push(['Profile Id', data.profileId ?? (data.profile?.id ?? '')])
	table.push(['Installed App Id', data.app?.installedAppId ?? ''])
	table.push(['External App Id', data.app?.externalId ?? ''])
	table.push(['App Profile Id', data.app?.profileId ?? ''])
	return table.toString()
}

export default class DevicesCommand extends ListingOutputAPICommand<Device, DeviceWithLocation> {
	static description = 'list all devices available in a user account or retrieve a single device'

	static flags = {
		...ListingOutputAPICommand.flags,
		'location-id': flags.string({
			char: 'l',
			description: 'filter results by location',
			multiple: true,
		}),
		capability: flags.string({
			char: 'c',
			description: 'filter results by capability',
			multiple: true,
		}),
		'capabilities-mode': flags.string({
			char: 'C',
			description: 'Treat capability filter query params as a logical "or" or "and" with a default of "and".',
			dependsOn: ['capability'],
			options: ['and', 'or'],
		}),
		'device-id': flags.string({
			char: 'd',
			description: 'filter results by device',
			multiple: true,
		}),
		'installed-app-id': flags.string({
			char: 'a',
			description: 'filter results by installed app that created the device',
		}),
		verbose: flags.boolean({
			description: 'include location name in output',
			char: 'v',
		}),
	}

	static args = [{
		name: 'id',
		description: 'device to retrieve; UUID or the number of the device from list',
	}]

	primaryKeyName = 'deviceId'
	sortKeyName = 'label'
	protected listTableFieldDefinitions = ['label', 'name', 'type', 'deviceId']

	protected buildTableOutput = buildTableOutput

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DevicesCommand)
		await super.setup(args, argv, flags)

		if (this.flags.verbose) {
			this.listTableFieldDefinitions.splice(3, 0, 'location', 'room')
		}

		const deviceListOptions: DeviceListOptions = {
			capability: flags.capability,
			capabilitiesMode: flags['capabilities-mode'] === 'or' ? 'or' : 'and',
			locationId: flags['location-id'],
			deviceId: flags['device-id'],
			installedAppId: flags['installed-app-id'],
		}

		await this.processNormally(
			args.id,
			async () => {
				const devices = await this.client.devices.list(deviceListOptions)
				if (flags.verbose) {
					return await withLocationsAndRooms(this.client, devices)
				}
				return devices
			},
			(id) => {return this.client.devices.get(id) },
		)
	}
}
