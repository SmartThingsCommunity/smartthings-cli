import { Flags } from '@oclif/core'

import { InstalledApp, InstalledAppListOptions } from '@smartthings/core-sdk'

import { APICommand, outputItemOrList, OutputItemOrListConfig, withLocation, withLocations, WithNamedLocation } from '@smartthings/cli-lib'
import { listTableFieldDefinitions, tableFieldDefinitions } from '../lib/commands/installedapps-util'


export default class InstalledAppsCommand extends APICommand<typeof InstalledAppsCommand.flags> {
	static description = 'get a specific app or a list of apps'

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
		description: 'the app id',
	}]

	async run(): Promise<void> {
		const config: OutputItemOrListConfig<InstalledApp & WithNamedLocation> = {
			primaryKeyName: 'installedAppId',
			sortKeyName: 'displayName',
			listTableFieldDefinitions,
			tableFieldDefinitions,
		}

		if (this.flags.verbose) {
			config.listTableFieldDefinitions.splice(3, 0, 'locationId', 'location')
			config.tableFieldDefinitions.splice(7, 0, 'location')
		}
		const verboseInstalledApp: (app: Promise<InstalledApp>) => Promise<InstalledApp & WithNamedLocation> =
			this.flags.verbose ? async app => withLocation(this.client, await app) : app => app

		const installedApps = async (): Promise<(InstalledApp & WithNamedLocation)[]> => {
			const listOptions: InstalledAppListOptions = {
				locationId: this.flags.location,
			}
			const apps = await this.client.installedApps.list(listOptions)
			if (this.flags.verbose) {
				return await withLocations(this.client, apps)
			}
			return apps
		}

		await outputItemOrList(this, config, this.args.id, installedApps,
			id => verboseInstalledApp(this.client.installedApps.get(id)),
		)
	}
}
