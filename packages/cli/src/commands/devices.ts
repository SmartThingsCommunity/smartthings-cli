import { APICommand, ListingOutputAPICommand } from '@smartthings/cli-lib'

import { Device, DeviceListOptions } from '@smartthings/core-sdk'

import { flags } from '@oclif/command'


export function buildTableOutput(this: APICommand, data: Device): string {
	const table = this.newOutputTable()
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
	table.push(['Profile Id', data.profileId ?? ''])
	table.push(['Installed App Id', data.app?.installedAppId ?? ''])
	table.push(['External App Id', data.app?.externalId ?? ''])
	table.push(['App Profile Id', data.app?.profileId ?? ''])
	return table.toString()
}

export default class DevicesCommand extends ListingOutputAPICommand<Device, DeviceListOptions> {
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
	}

	static args = [{
		name: 'id',
		description: 'device to retrieve; UUID or the number of the device from list',
		required: false,
	}]

	primaryKeyName = 'deviceId'
	sortKeyName = 'name'

	protected buildObjectTableOutput = buildTableOutput

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DevicesCommand)
		await super.setup(args, argv, flags)

		const deviceListOptions: DeviceListOptions = {
			capability: flags.capability,
			capabilitiesMode: flags['capabilities-mode'] === 'or' ? 'or' : 'and',
			locationId: flags['location-id'],
			deviceId: flags['device-id'],
		}

		this.processNormally(
			args.id,
			() => { return this.client.devices.list(deviceListOptions) },
			(id) => {return this.client.devices.get(id) },
		)
	}
}
