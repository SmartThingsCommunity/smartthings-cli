import { flags } from '@oclif/command'

import { InstalledApp, InstalledAppListOptions } from '@smartthings/core-sdk'

import {selectAndActOn, APICommand, withLocations} from '@smartthings/cli-lib'


export default class InstalledAppDeleteCommand extends APICommand {
	static description = 'delete the installed app instance'

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
		description: 'installed app UUID',
	}]

	primaryKeyName = 'installedAppId'
	sortKeyName = 'displayName'
	protected listTableFieldDefinitions = ['displayName', 'installedAppType',
		'installedAppStatus', 'installedAppId']

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(InstalledAppDeleteCommand)
		await super.setup(args, argv, flags)

		if (this.flags.verbose) {
			this.listTableFieldDefinitions.splice(3, 0, 'location')
		}

		const listOptions: InstalledAppListOptions = {
			locationId: flags['location-id'],
		}

		await selectAndActOn<InstalledApp>(this, args.id,
			async () => {
				const apps = await this.client.installedApps.list(listOptions)
				if (this.flags.verbose) {
					return await withLocations(this.client, apps)
				}
				return apps
			},
			async id => { await this.client.installedApps.delete(id) },
			'installed app {{id}} deleted')
	}
}
