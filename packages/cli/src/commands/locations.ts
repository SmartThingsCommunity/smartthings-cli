import { Location, LocationItem } from '@smartthings/core-sdk'

import { ListingOutputAPICommand } from '@smartthings/cli-lib'


export const tableFieldDefinitions = [
	'name', 'locationId', 'countryCode', 'timeZoneId', 'backgroundImage',
	'latitude', 'longitude', 'regionRadius', 'temperatureScale', 'locale',
]

export default class LocationsCommand extends ListingOutputAPICommand<Location, LocationItem> {
	static description = 'get a specific Location'

	static flags = ListingOutputAPICommand.flags

	static args = [{
		name: 'idOrIndex',
		description: 'the location id or number in list',
	}]

	primaryKeyName = 'locationId'
	sortKeyName = 'name'

	protected tableFieldDefinitions = tableFieldDefinitions

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(LocationsCommand)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.idOrIndex,
			() => this.client.locations.list(),
			(id) => this.client.locations.get(id),
		)
	}
}
