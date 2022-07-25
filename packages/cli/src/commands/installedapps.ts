import { Flags } from '@oclif/core'

import { InstalledApp, InstalledAppListOptions } from '@smartthings/core-sdk'

import { APICommand, outputListing, withLocations } from '@smartthings/cli-lib'
import { InstalledAppWithLocation, listTableFieldDefinitions, tableFieldDefinitions } from '../lib/commands/installedapps-util'


export default class InstalledAppsCommand extends APICommand<typeof InstalledAppsCommand.flags> {
	static description = 'get a specific app or a list of apps'

	static flags = {
		...APICommand.flags,
		...outputListing.flags,
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
		description: 'the app id',
	}]

	async run(): Promise<void> {
		const config = {
			primaryKeyName: 'installedAppId',
			sortKeyName: 'displayName',
			listTableFieldDefinitions,
			tableFieldDefinitions,
		}
		if (this.flags.verbose) {
			config.listTableFieldDefinitions.splice(3, 0, 'location')
		}

		const listOptions: InstalledAppListOptions = {
			locationId: this.flags['location-id'],
		}

		await outputListing<InstalledApp, InstalledAppWithLocation>(this, config, this.args.id,
			async () => {
				const apps = await this.client.installedApps.list(listOptions)
				if (this.flags.verbose) {
					return await withLocations(this.client, apps)
				}
				return apps
			},
			id => this.client.installedApps.get(id),
		)
	}
}
