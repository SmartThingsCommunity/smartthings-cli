import { LocationCreate, Location } from '@smartthings/core-sdk'

import { APICommand, inputAndOutputItem } from '@smartthings/cli-lib'

import { tableFieldDefinitions } from '../locations'


export default class LocationsCreateCommand extends APICommand {
	static description = 'create a Location for a user'

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
	}

	tableFieldDefinitions = tableFieldDefinitions

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(LocationsCreateCommand)
		await super.setup(args, argv, flags)

		await inputAndOutputItem<LocationCreate, Location>(this, input => this.client.locations.create(input))
	}
}
