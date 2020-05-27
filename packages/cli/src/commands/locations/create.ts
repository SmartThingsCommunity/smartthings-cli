import { LocationCreate, Location } from '@smartthings/core-sdk'

import { InputOutputAPICommand } from '@smartthings/cli-lib'

import { buildTableOutput } from '../locations'

export default class LocationsCreate extends InputOutputAPICommand<LocationCreate, Location> {
	static description = 'create a Location for a user'

	static flags = InputOutputAPICommand.flags

	protected buildTableOutput(location: Location): string {
		return buildTableOutput(location)
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(LocationsCreate)
		await super.setup(args, argv, flags)

		this.processNormally(location => {
			return this.client.locations.create(location)
		})
	}
}
