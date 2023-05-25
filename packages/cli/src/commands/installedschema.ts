import { Flags } from '@oclif/core'

import { InstalledSchemaApp } from '@smartthings/core-sdk'

import { APICommand, OutputItemOrListConfig, outputItemOrList, WithNamedLocation, withLocation } from '@smartthings/cli-lib'

import {
	installedSchemaInstances,
	listTableFieldDefinitions,
	tableFieldDefinitions,
} from '../lib/commands/installedschema-util.js'


export default class InstalledSchemaAppsCommand extends APICommand<typeof InstalledSchemaAppsCommand.flags> {
	static description = 'get a specific schema connector instance or a list of instances' +
		this.apiDocsURL('getIsaByLocationId', 'getDevicesByIsaId')

	static flags = {
		...APICommand.flags,
		...outputItemOrList.flags,
		location: Flags.string({
			char: 'l',
			description: 'filter results by location',
			multiple: true,
			helpValue: '<UUID>',
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
		const config: OutputItemOrListConfig<InstalledSchemaApp & WithNamedLocation> = {
			primaryKeyName: 'isaId',
			sortKeyName: 'appName',
			listTableFieldDefinitions,
			tableFieldDefinitions,
		}

		if (this.flags.verbose) {
			config.listTableFieldDefinitions = [...listTableFieldDefinitions]
			config.listTableFieldDefinitions.splice(3, 0, 'locationId', 'location')
			config.tableFieldDefinitions = [...tableFieldDefinitions]
			config.tableFieldDefinitions.splice(5, 0, 'location')
		}
		const verboseInstalledApp: (app: Promise<InstalledSchemaApp>) => Promise<InstalledSchemaApp & WithNamedLocation> =
			this.flags.verbose ? async app => withLocation(this.client, await app) : app => app

		await outputItemOrList(this, config, this.args.id,
			() => installedSchemaInstances(this.client, this.flags.location, this.flags.verbose),
			id => verboseInstalledApp(this.client.schema.getInstalledApp(id)),
		)
	}
}
