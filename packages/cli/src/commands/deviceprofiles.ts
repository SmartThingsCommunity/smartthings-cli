import { DeviceProfile } from '@smartthings/core-sdk'

import { ListingOutputAPICommand, TableGenerator } from '@smartthings/cli-lib'


export function buildTableOutput(tableGenerator: TableGenerator, data: DeviceProfile): string {
	const table = tableGenerator.newOutputTable()
	table.push(['Name', data.name])
	for (const comp of data.components) {
		table.push([`${comp.id} component`,  comp.capabilities ? comp.capabilities.map(it => it.id).join('\n') : ''])
	}
	table.push(['Id', data.id])
	table.push(['Device Type', data.metadata?.deviceType ?? ''])
	table.push(['OCF Device Type', data.metadata?.ocfDeviceType ?? ''])
	table.push(['mnmn', data.metadata?.mnmn ?? ''])
	table.push(['vid', data.metadata?.vid ?? ''])
	table.push(['Status', data.status])
	return table.toString()
}

export default class DeviceProfilesList extends ListingOutputAPICommand<DeviceProfile, DeviceProfile> {
	static description = 'list all device profiles available in a user account or retrieve a single profile'

	static flags = ListingOutputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'device profile to retrieve; UUID or the number of the profile from list',
		required: false,
	}]

	static examples = [
		'$ smartthings deviceprofiles                      # list all device profiles',
		'$ smartthings deviceprofiles bb0fdc5-...-a8bd2ea  # show device profile with the specified UUID',
		'$ smartthings deviceprofiles 2                    # show the second device profile in the list',
		'$ smartthings deviceprofiles 3 -j                 # show the profile in JSON format',
		'$ smartthings deviceprofiles 5 -y                 # show the profile in YAML format',
		'$ smartthings deviceprofiles 4 -j -o profile.json # write the profile to the file "profile.json"',
	]

	static aliases = ['device-profiles']

	primaryKeyName = 'id'
	sortKeyName = 'name'
	protected tableHeadings(): string[] { return ['name', 'status', 'id'] }

	protected buildObjectTableOutput(deviceProfile: DeviceProfile): string {
		return buildTableOutput(this, deviceProfile)
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceProfilesList)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => { return this.client.deviceProfiles.list() },
			(id) => { return this.client.deviceProfiles.get(id) },
		)
	}
}
