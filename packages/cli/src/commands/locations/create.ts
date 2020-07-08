import { LocationCreate, Location } from '@smartthings/core-sdk'

import { InputOutputAPICommand } from '@smartthings/cli-lib'

import { tableFieldDefinitions } from '../locations'


export default class LocationsCreateCommand extends InputOutputAPICommand<LocationCreate, Location> {
	static description = 'create a Location for a user'

	static flags = InputOutputAPICommand.flags

	protected tableFieldDefinitions = tableFieldDefinitions

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(LocationsCreateCommand)
		await super.setup(args, argv, flags)

		this.processNormally(location => this.client.locations.create(location))
	}
}
