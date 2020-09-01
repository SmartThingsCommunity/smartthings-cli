import { flags } from '@oclif/command'

import { InstalledApp } from '@smartthings/core-sdk'

import { ListingOutputAPICommand, TableFieldDefinition, withLocations } from '@smartthings/cli-lib'


export type InstalledAppWithLocation = InstalledApp & { location?: string }

export default class InstalledAppsCommand extends ListingOutputAPICommand<InstalledApp, InstalledAppWithLocation> {
	static description = 'get a specific app or a list of apps'

	static flags = {
		...ListingOutputAPICommand.flags,
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
	protected listTableFieldDefinitions = ['displayName', 'installedAppType',
		'installedAppStatus', 'installedAppId']

	protected tableFieldDefinitions: TableFieldDefinition<InstalledApp>[] = [
		'displayName', 'installedAppId', 'installedAppType', 'installedAppStatus',
		'singleInstance', 'appId', 'locationId', 'singleInstance',
		{
			label: 'Classifications',
			value: installedApp => installedApp.classifications?.join('\n') ?? '',
			include: installedApp => !!installedApp.classifications,
		},
	]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(InstalledAppsCommand)
		await super.setup(args, argv, flags)

		if (this.flags.verbose) {
			this.listTableFieldDefinitions.splice(3, 0, 'location')
		}

		this.processNormally(
			args.id,
			async () => {
				const apps = await this.client.installedApps.list()
				if (flags.verbose) {
					return await withLocations(this.client, apps)
				}
				return apps
			},
			(id: string) => {
				return this.client.installedApps.get(id)
			},
		)
	}
}
