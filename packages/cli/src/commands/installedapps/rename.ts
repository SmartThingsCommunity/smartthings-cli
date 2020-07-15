import inquirer from 'inquirer'

import { InstalledApp } from '@smartthings/core-sdk'
import { SelectingOutputAPICommand } from '@smartthings/cli-lib'
import { buildTableOutput } from '../devices'


export default class DeviceComponentStatusCommand extends SelectingOutputAPICommand<InstalledApp, InstalledApp> {
	static description = 'renamed an installed app instance'

	static flags = SelectingOutputAPICommand.flags

	static args = [
		{
			name: 'id',
			description: 'the device id',
		},
		{
			name: 'name',
			description: 'the new device name',
		},
	]

	protected buildTableOutput = buildTableOutput

	primaryKeyName = 'deviceId'
	sortKeyName = 'label'
	listTableFieldDefinitions = ['label', 'name', 'type', 'deviceId']
	acceptIndexId = true

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceComponentStatusCommand)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => this.client.installedApps.list(),
			async (id) => {
				let displayName = args.name
				if (!displayName) {
					displayName = (await inquirer.prompt({
						type: 'input',
						name: 'label',
						message: 'Enter new installed app name:',
					})).label
				}
				return this.client.installedApps.update(id, {displayName})
			},
		)
	}
}
