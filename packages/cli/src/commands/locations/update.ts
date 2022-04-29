import { Location, LocationUpdate } from '@smartthings/core-sdk'

import { APICommand, inputAndOutputItem } from '@smartthings/cli-lib'

import { chooseLocation, tableFieldDefinitions } from '../locations'


export default class LocationsUpdateCommand extends APICommand<typeof LocationsUpdateCommand.flags> {
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
		const id = await chooseLocation(this, this.args.id)
		await inputAndOutputItem<LocationUpdate, Location>(this, { tableFieldDefinitions },
			(_, location) => this.client.locations.update(id, location))
	}
}
