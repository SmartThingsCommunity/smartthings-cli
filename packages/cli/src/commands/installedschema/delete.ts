import { flags } from '@oclif/command'

import { InstalledSchemaApp } from '@smartthings/core-sdk'

import {selectAndActOn, APICommand} from '@smartthings/cli-lib'

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

	primaryKeyName = 'isaId'
	sortKeyName = 'appName'
	listTableFieldDefinitions = ['appName', 'partnerName', 'partnerSTConnection', 'isaId']

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(InstalledSchemaAppDeleteCommand)
		await super.setup(args, argv, flags)

		if (this.flags.verbose) {
			this.listTableFieldDefinitions.splice(3, 0, 'location')
		}

		await selectAndActOn<InstalledSchemaApp>(this, args.id,
			() => installedSchemaInstances(this.client, flags['location-id'], flags.verbose),
			async id => { await this.client.schema.deleteInstalledApp(id) },
			'installed schema app {{id}} deleted')
	}
}
