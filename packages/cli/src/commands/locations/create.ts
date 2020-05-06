import Table from 'cli-table'

import { LocationCreate, Location } from '@smartthings/core-sdk'

import { InputOutputAPICommand } from '@smartthings/cli-lib'


export default class LocationsCreate extends InputOutputAPICommand<LocationCreate, Location> {
	static description = 'create a Location for a user'

	static flags = InputOutputAPICommand.flags

	protected buildTableOutput(location: Location): string {
		// TODO: swap axes, include more fields, share with ../locations.ts
		const table = new Table({ head: ['Id', 'Name'] })
		table.push([location.locationId, location.name])
		return table.toString()
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(LocationsCreate)
		await super.setup(args, argv, flags)

		this.processNormally(location => {
			return this.client.locations.create(location)
		})
	}
}
