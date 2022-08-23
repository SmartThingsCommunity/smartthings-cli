import { Flags } from '@oclif/core'

import { InstalledSchemaApp } from '@smartthings/core-sdk'

import { APICommand, selectFromList, SelectFromListConfig } from '@smartthings/cli-lib'

import { installedSchemaInstances } from '../../lib/commands/installedschema-util'


export default class InstalledSchemaAppDeleteCommand extends APICommand<typeof InstalledSchemaAppDeleteCommand.flags> {
	static description = 'delete the installed schema connector instance'

	static flags = {
		...APICommand.flags,
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
		description: 'installed schema connector UUID',
	}]

	async run(): Promise<void> {
		const config: SelectFromListConfig<InstalledSchemaApp> = {
			primaryKeyName: 'isaId',
			sortKeyName: 'appName',
			listTableFieldDefinitions: ['appName', 'partnerName', 'partnerSTConnection', 'isaId'],
		}
		if (this.flags.verbose) {
			config.listTableFieldDefinitions.splice(3, 0, 'location')
		}

		const id = await selectFromList<InstalledSchemaApp>(this, config, {
			preselectedId: this.args.id,
			// TODO: test if this.flags['location-id'] is an empty array or undefined if no location ids passed on command line
			listItems: () => installedSchemaInstances(this.client, this.flags['location-id'], this.flags.verbose),
			promptMessage: 'Select an installed schema app to delete.',
		})
		await this.client.schema.deleteInstalledApp(id)
		this.log(`Installed schema app ${id} deleted.`)
	}
}
