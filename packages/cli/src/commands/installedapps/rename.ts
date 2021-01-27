import { flags } from '@oclif/command'
import inquirer from 'inquirer'

import { InstalledApp, InstalledAppListOptions } from '@smartthings/core-sdk'
import {selectActOnAndOutput, APICommand, withLocations} from '@smartthings/cli-lib'
import { listTableFieldDefinitions, tableFieldDefinitions } from '../installedapps'


export default class DeviceComponentStatusCommand extends APICommand {
	static description = 'renamed an installed app instance'

	static flags = {
		...APICommand.flags,
		...selectActOnAndOutput.flags,
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

	tableFieldDefinitions = tableFieldDefinitions

	itemName = 'installed app'
	primaryKeyName = 'installedAppId'
	sortKeyName = 'displayName'
	listTableFieldDefinitions = listTableFieldDefinitions
	acceptIndexId = true

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceComponentStatusCommand)
		await super.setup(args, argv, flags)

		if (this.flags.verbose) {
			this.listTableFieldDefinitions.splice(3, 0, 'location')
		}

		const listOptions: InstalledAppListOptions = {
			locationId: flags['location-id'],
		}

		await selectActOnAndOutput<InstalledApp, InstalledApp>(this,
			args.id,
			async () => {
				const apps = await this.client.installedApps.list(listOptions)
				if (this.flags.verbose) {
					return await withLocations(this.client, apps)
				}
				return apps
			},
			async id => {
				const displayName = args.name ??
					(await inquirer.prompt({
						type: 'input',
						name: 'label',
						message: 'Enter new installed app name:',
					})).label
				return this.client.installedApps.update(id, { displayName })
			},
		)
	}
}
