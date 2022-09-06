import { Flags } from '@oclif/core'

import { InstalledSchemaApp } from '@smartthings/core-sdk'

import { APICommand, OutputItemOrListConfig, outputItemOrList } from '@smartthings/cli-lib'

import {
	InstalledSchemaAppWithLocation,
	installedSchemaInstances,
	listTableFieldDefinitions,
	tableFieldDefinitions,
} from '../lib/commands/installedschema-util'


export default class InstalledSchemaAppsCommand extends APICommand<typeof InstalledSchemaAppsCommand.flags> {
	static description = 'get a specific schema connector instance or a list of instances'

	static flags = {
		...APICommand.flags,
		...outputItemOrList.flags,
		// eslint-disable-next-line @typescript-eslint/naming-convention
		'location-id': Flags.string({
			char: 'l',
			description: 'filter results by location',
			multiple: true,
		}),
		verbose: Flags.boolean({
			description: 'include location name in output',
			char: 'v',
		}),
	}

	static args = [{
		name: 'id',
		description: 'the isa id',
	}]

	async run(): Promise<void> {
		const config: OutputItemOrListConfig<InstalledSchemaApp, InstalledSchemaAppWithLocation> = {
			primaryKeyName: 'isaId',
			sortKeyName: 'appName',
			listTableFieldDefinitions,
			tableFieldDefinitions,
		}

		if (this.flags.verbose) {
			config.listTableFieldDefinitions.splice(3, 0, 'location')
			config.tableFieldDefinitions.splice(5, 0, 'location')
		}

		await outputItemOrList(this, config, this.args.id,
			() => installedSchemaInstances(this.client, this.flags['location-id'], this.flags.verbose),
			id => this.client.schema.getInstalledApp(id),
		)
	}
}
