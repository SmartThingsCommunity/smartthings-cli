import Table from 'cli-table'

import { LocationItem } from '@smartthings/core-sdk'

import { OutputAPICommand } from '@smartthings/cli-lib'


export default class LocationsList extends OutputAPICommand<LocationItem[]> {
	static description = 'list all Locations currently available in a user account'

	static flags = {
		...OutputAPICommand.flags,
	}

	protected buildTableOutput(locations: LocationItem[]): string {
		const table = new Table({ head: ['Id', 'Name'] })
		for (const location of locations) {
			table.push([location.locationId, location.name])
		}
		return table.toString()
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(LocationsList)
		await super.setup(args, argv, flags)

		this.processNormally(() => {
			return this.client.locations.list()
		})
	}
}
