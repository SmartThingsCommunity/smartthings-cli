import { flags } from '@oclif/command'

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

export default class InstalledAppsCommand extends APICommand {
	static description = 'get a specific app or a list of apps'

	static flags = {
		...APICommand.flags,
		...outputListing.flags,
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
		description: 'the app id',
	}]

	primaryKeyName = 'installedAppId'
	sortKeyName = 'displayName'
	listTableFieldDefinitions = listTableFieldDefinitions
	tableFieldDefinitions = tableFieldDefinitions

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(InstalledAppsCommand)
		await super.setup(args, argv, flags)

		if (this.flags.verbose) {
			this.listTableFieldDefinitions.splice(3, 0, 'location')
		}

		const listOptions: InstalledAppListOptions = {
			locationId: flags['location-id'],
		}

		await outputListing<InstalledApp, InstalledAppWithLocation>(this,
			args.id,
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
