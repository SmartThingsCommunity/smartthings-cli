import { InputOutputAPICommand } from '@smartthings/cli-lib'
import { Location, LocationUpdate } from '@smartthings/core-sdk'

import { buildTableOutput } from '../locations'


export default class LocationsUpdateCommand extends InputOutputAPICommand <LocationUpdate, Location> {
	static description = 'update a location'

	static flags = InputOutputAPICommand.flags

	static args = [{
		name: 'id',
		description: 'location UUID',
		required: true,
	}]

	primaryKeyName = 'locationId'
	sortKeyName = 'name'

	protected buildTableOutput = buildTableOutput

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(LocationsUpdateCommand)
		await super.setup(args, argv, flags)

		this.processNormally(data => { return this.client.locations.update(args.id, data) })
	}
}
