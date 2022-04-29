import { Flags } from '@oclif/core'

import { InstalledApp, InstalledAppListOptions } from '@smartthings/core-sdk'

import { APICommand, outputListing, TableFieldDefinition, withLocations } from '@smartthings/cli-lib'


export type InstalledAppWithLocation = InstalledApp & { location?: string }

export const listTableFieldDefinitions = ['displayName', 'installedAppType', 'installedAppStatus', 'installedAppId']
export const tableFieldDefinitions: TableFieldDefinition<InstalledApp>[] = [
	'displayName', 'installedAppId', 'installedAppType', 'installedAppStatus',
	'singleInstance', 'appId', 'locationId', 'singleInstance',
	{
		label: 'Classifications',
		value: installedApp => installedApp.classifications?.join('\n') ?? '',
		include: installedApp => !!installedApp.classifications,
	},
]

export default class InstalledAppsCommand extends APICommand<typeof InstalledAppsCommand.flags> {
	static description = 'get a specific app or a list of apps'

	static flags = {
		...APICommand.flags,
		...outputListing.flags,
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
