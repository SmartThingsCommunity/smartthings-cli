import inquirer from 'inquirer'

import { InstalledApp } from '@smartthings/core-sdk'
import { selectActOnAndOutput, APICommand } from '@smartthings/cli-lib'
import { listTableFieldDefinitions, tableFieldDefinitions } from '../installedapps'


export default class DeviceComponentStatusCommand extends APICommand {
	static description = 'renamed an installed app instance'

	static flags = {
		...APICommand.flags,
		...selectActOnAndOutput.flags,
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

		await selectActOnAndOutput<InstalledApp, InstalledApp>(this,
			args.id,
			() => this.client.installedApps.list(),
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
