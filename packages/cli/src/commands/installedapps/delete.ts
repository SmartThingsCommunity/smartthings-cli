import { Flags } from '@oclif/core'

import { InstalledApp, InstalledAppListOptions } from '@smartthings/core-sdk'

import { selectFromList, APICommand, withLocations } from '@smartthings/cli-lib'


export default class InstalledAppDeleteCommand extends APICommand<typeof InstalledAppDeleteCommand.flags> {
	static description = 'delete the installed app instance'

	static flags = {
		...APICommand.flags,
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
		description: 'installed app UUID',
	}]

	async run(): Promise<void> {
		const config = {
			primaryKeyName: 'installedAppId',
			sortKeyName: 'displayName',
			listTableFieldDefinitions: ['displayName', 'installedAppType', 'installedAppStatus', 'installedAppId'],
		}
		if (this.flags.verbose) {
			config.listTableFieldDefinitions.splice(3, 0, 'location')
		}

		const listOptions: InstalledAppListOptions = {
			locationId: this.flags['location-id'],
		}

		const id = await selectFromList<InstalledApp>(this, config, {
			preselectedId: this.args.id,
			listItems: async () => {
				const apps = await this.client.installedApps.list(listOptions)
				if (this.flags.verbose) {
					return await withLocations(this.client, apps)
				}
				return apps
			},
			promptMessage: 'Select an installed app to delete.',
		})
		await this.client.installedApps.delete(id),
		this.log(`Installed app ${id} deleted.`)
	}
}
