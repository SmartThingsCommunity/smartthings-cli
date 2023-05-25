import { EdgeDriverSummary } from '@smartthings/core-sdk'

import { outputList, OutputListConfig } from '@smartthings/cli-lib'

import { EdgeCommand } from '../../../lib/edge-command.js'
import { listTableFieldDefinitions } from '../../../lib/commands/drivers-util.js'


export default class DriversDefaultCommand extends EdgeCommand<typeof DriversDefaultCommand.flags> {
	static description = 'list default drivers available to all users' +
		this.apiDocsURL('getDefaultDrivers')

	static flags = {
		...EdgeCommand.flags,
		...outputList.flags,
	}

	static examples = [`# list default drivers
$ smartthings edge:drivers:default`]

	async run(): Promise<void> {
		const config: OutputListConfig<EdgeDriverSummary> = {
			primaryKeyName: 'driverId',
			sortKeyName: 'name',
			listTableFieldDefinitions,
		}

		await outputList(this, config, () => this.client.drivers.listDefault())
	}
}
