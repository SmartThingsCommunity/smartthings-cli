import { Location, LocationUpdate } from '@smartthings/core-sdk'

import { APICommand, inputAndOutputItem } from '@smartthings/cli-lib'

import { chooseLocation, tableFieldDefinitions } from '../locations'


export default class LocationsUpdateCommand extends APICommand {
	static description = 'update a location'

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
	}

	static args = [{
		name: 'id',
		description: 'the location id',
	}]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(LocationsUpdateCommand)
		await super.setup(args, argv, flags)

		const id = await chooseLocation(this, args.id)
		await inputAndOutputItem<LocationUpdate, Location>(this, { tableFieldDefinitions },
			(_, location) => this.client.locations.update(id, location))
	}
}
