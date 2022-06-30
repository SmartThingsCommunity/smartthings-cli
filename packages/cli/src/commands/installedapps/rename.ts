import { Flags } from '@oclif/core'
import inquirer from 'inquirer'

import { InstalledAppListOptions } from '@smartthings/core-sdk'

import { APICommand, formatAndWriteItem, selectFromList, withLocations } from '@smartthings/cli-lib'
import { listTableFieldDefinitions, tableFieldDefinitions } from '../../lib/commands/installedapps-util'


export default class InstalledAppRenameCommand extends APICommand<typeof InstalledAppRenameCommand.flags> {
	static description = 'renamed an installed app instance'

	static flags = {
		...APICommand.flags,
		...formatAndWriteItem.flags,
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

	static args = [
		{
			name: 'id',
			description: 'the installed app id',
		},
		{
			name: 'name',
			description: 'the new installed app name',
		},
	]

	async run(): Promise<void> {
		const config = {
			itemName: 'installed app',
			primaryKeyName: 'installedAppId',
			sortKeyName: 'displayName',
			tableFieldDefinitions,
			listTableFieldDefinitions,
		}
		if (this.flags.verbose) {
			config.listTableFieldDefinitions.splice(3, 0, 'location')
		}
		const listOptions: InstalledAppListOptions = {
			locationId: this.flags['location-id'],
		}

		const id = await selectFromList(this, config, {
			preselectedId: this.args.id,
			listItems: async () => {
				const apps = await this.client.installedApps.list(listOptions)
				if (this.flags.verbose) {
					return await withLocations(this.client, apps)
				}
				return apps
			},
			promptMessage: 'Select an app to rename.',
		})
		const displayName = this.args.name ??
			(await inquirer.prompt({
				type: 'input',
				name: 'label',
				message: 'Enter new installed app name:',
			})).label
		const updatedApp = await this.client.installedApps.update(id, { displayName })
		await formatAndWriteItem(this, config, updatedApp)
	}
}
