import { flags } from '@oclif/command'

import { InstalledSchemaApp } from '@smartthings/core-sdk'

import { APICommand, selectFromList } from '@smartthings/cli-lib'

import { installedSchemaInstances } from '../installedschema'


export default class InstalledSchemaAppDeleteCommand extends APICommand {
	static description = 'delete the installed schema connector instance'

	static flags = {
		...APICommand.flags,
		'location-id': flags.string({
			char: 'l',
			description: 'filter results by location',
			multiple: true,
		}),
		verbose: flags.boolean({
			description: 'include location name in output',
			char: 'v',
		}),
	}
	static args = [{
		name: 'id',
		description: 'installed schema connector UUID',
	}]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(InstalledSchemaAppDeleteCommand)
		await super.setup(args, argv, flags)

		const config = {
			primaryKeyName: 'isaId',
			sortKeyName: 'appName',
			listTableFieldDefinitions: ['appName', 'partnerName', 'partnerSTConnection', 'isaId'],
		}
		if (this.flags.verbose) {
			config.listTableFieldDefinitions.splice(3, 0, 'location')
		}

		const id = await selectFromList<InstalledSchemaApp>(this, config, args.id,
			() => installedSchemaInstances(this.client, flags['location-id'], flags.verbose),
			'Select an installed schema app to delete.')
		await this.client.schema.deleteInstalledApp(id)
		this.log(`Installed schema app ${id} deleted.`)
	}
}
