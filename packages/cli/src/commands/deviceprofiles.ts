import { DeviceProfile } from '@smartthings/core-sdk'

import {APICommand, outputListing, TableFieldDefinition} from '@smartthings/cli-lib'

import { flags } from '@oclif/command'


export function buildTableOutput(this: APICommand, data: DeviceProfile): string {
	const table = this.tableGenerator.newOutputTable()
	table.push(['Name', data.name])
	for (const comp of data.components) {
		table.push([`${comp.id} component`,  comp.capabilities ? comp.capabilities.map(it => it.id).join('\n') : ''])
	}
	table.push(['Id', data.id])
	table.push(['Device Type', data.metadata?.deviceType ?? ''])
	table.push(['OCF Device Type', data.metadata?.ocfDeviceType ?? ''])
	table.push(['Manufacturer Name', data.metadata?.mnmn ?? ''])
	table.push(['Presentation ID', data.metadata?.vid ?? ''])
	table.push(['Status', data.status])
	return table.toString()
}

export default class DeviceProfilesList extends APICommand {
	static description = 'list all device profiles available in a user account or retrieve a single profile'

	static flags = {
		...APICommand.flags,
		...outputListing.flags,
		verbose: flags.boolean({
			description: 'include presentationId and manufacturerName in list output',
			char: 'v',
		}),
	}

	static args = [{
		name: 'id',
		description: 'device profile to retrieve; UUID or the number of the profile from list',
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

	listTableFieldDefinitions: TableFieldDefinition<DeviceProfile>[] = ['name', 'status', 'id']

	buildTableOutput = buildTableOutput

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceProfilesList)
		await super.setup(args, argv, flags)

		if (this.flags.verbose) {
			this.listTableFieldDefinitions.push({ label: 'Presentation ID', value: (item) => item.metadata ? item.metadata.vid : '' })
			this.listTableFieldDefinitions.push({ label: 'Manufacturer Name', value: (item) => item.metadata ? item.metadata.mnmn : '' })
		}

		await outputListing(this, args.id,
			() => { return this.client.deviceProfiles.list() },
			(id) => { return this.client.deviceProfiles.get(id) },
		)
	}
}
