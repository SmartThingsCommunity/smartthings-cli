import { Location, LocationItem, LocationUpdate } from '@smartthings/core-sdk'

import { SelectingInputOutputAPICommand } from '@smartthings/cli-lib'

import { tableFieldDefinitions } from '../locations'


export default class LocationsUpdateCommand extends SelectingInputOutputAPICommand<LocationUpdate, Location, LocationItem> {
	static description = 'update a location'

	static flags = SelectingInputOutputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'the location id',
	}]

	primaryKeyName = 'locationId'
	sortKeyName = 'name'

	protected tableFieldDefinitions = tableFieldDefinitions

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(LocationsUpdateCommand)
		await super.setup(args, argv, flags)

		this.processNormally(args.id,
			() => this.client.locations.list(),
			(id, location) => this.client.locations.update(id, location))
	}
}
