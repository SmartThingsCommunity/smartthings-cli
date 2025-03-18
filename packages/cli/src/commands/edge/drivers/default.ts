import { EdgeDriver } from '@smartthings/core-sdk'

import { outputItemOrList, OutputItemOrListConfig } from '@smartthings/cli-lib'

import { EdgeCommand } from '../../../lib/edge-command'
import { buildTableOutput, listTableFieldDefinitions } from '../../../lib/commands/drivers-util'


export default class DriversDefaultCommand extends EdgeCommand<typeof DriversDefaultCommand.flags> {
	static description = 'list default drivers available to all users' +
		this.apiDocsURL('getDefaultDrivers')

	static flags = {
		...EdgeCommand.flags,
		...outputItemOrList.flags,
	}

	static args = [{
		name: 'idOrIndex',
		description: 'the driver id or number in list',
	}]

	static examples = [`# list default drivers
$ smartthings edge:drivers:default`,
	`# show details about a specific default driver
$ smartthings edge:drivers:default 12`]

	async run(): Promise<void> {
		const config: OutputItemOrListConfig<EdgeDriver> = {
			primaryKeyName: 'driverId',
			sortKeyName: 'name',
			buildTableOutput: (driver: EdgeDriver) => buildTableOutput(this.tableGenerator, driver),
			listTableFieldDefinitions,
		}

		await outputItemOrList(this, config, this.args.idOrIndex,
			() => this.client.drivers.listDefault(),
			async (id) => {
				const list = await this.client.drivers.listDefault()
				const driver = list.find(it => it.driverId === id)
				if (!driver) {
					throw Error(`Could not find driver with id ${id}`)
				}
				return driver
			})
	}
}
