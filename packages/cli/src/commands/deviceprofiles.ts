import { Flags } from '@oclif/core'

import { DeviceProfile } from '@smartthings/core-sdk'

import {
	APIOrganizationCommand,
	WithOrganization,
	allOrganizationsFlags,
	outputItemOrList,
	forAllOrganizations,
	OutputItemOrListConfig,
} from '@smartthings/cli-lib'

import { buildTableOutput } from '../lib/commands/deviceprofiles-util'


export default class DeviceProfilesCommand extends APIOrganizationCommand<typeof DeviceProfilesCommand.flags> {
	static description = 'list all device profiles available in a user account or retrieve a single profile'

	static flags = {
		...APIOrganizationCommand.flags,
		...outputItemOrList.flags,
		...allOrganizationsFlags,
		verbose: Flags.boolean({
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

	async run(): Promise<void> {
		const config: OutputItemOrListConfig<DeviceProfile & WithOrganization> = {
			primaryKeyName: 'id',
			sortKeyName: 'name',
			listTableFieldDefinitions: ['name', 'status', 'id'],
			buildTableOutput: (data: DeviceProfile) => buildTableOutput(this.tableGenerator, data),
		}

		if (this.flags['all-organizations']) {
			config.listTableFieldDefinitions = ['name', 'status', 'id', 'organization']
		}

		if (this.flags.verbose) {
			config.listTableFieldDefinitions.push({ label: 'Presentation ID', value: item => item.metadata?.vid ?? '' })
			config.listTableFieldDefinitions.push({ label: 'Manufacturer Name', value: item => item.metadata?.mnmn ?? '' })
		}

		await outputItemOrList(this, config, this.args.id,
			() => this.flags['all-organizations']
				? forAllOrganizations(this.client, (orgClient) => orgClient.deviceProfiles.list())
				: this.client.deviceProfiles.list(),
			id => this.client.deviceProfiles.get(id),
		)
	}
}
