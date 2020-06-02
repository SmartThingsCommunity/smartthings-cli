import { Location, LocationItem } from '@smartthings/core-sdk'

import { APICommand, ListingOutputAPICommand } from '@smartthings/cli-lib'


export function buildTableOutput(this: APICommand, data: Location): string {
	const table = this.newOutputTable()
	table.push(['Name', data.name])
	table.push(['Id', data.locationId])
	table.push(['Country', data.countryCode])
	table.push(['Timezone', data.timeZoneId ?? ''])
	table.push(['Background Image', data.backgroundImage ?? ''])
	table.push(['Latitude', data.latitude ?? ''])
	table.push(['Longitude', data.longitude ?? ''])
	table.push(['Region Radius', data.regionRadius ?? ''])
	table.push(['Temperature Scale', data.temperatureScale])
	table.push(['Locale', data.locale ?? ''])
	table.push(['Additional Properties', data.additionalProperties ?? ''])
	return table.toString()
}

export default class LocationsCommand extends ListingOutputAPICommand<Location, LocationItem> {
	static description = 'get a specific Location'

	static flags = ListingOutputAPICommand.flags

	static args = [{
		name: 'id',
		// TODO: fix description
		description: 'the location id',
	}]

	primaryKeyName = 'locationId'
	sortKeyName = 'name'

	protected buildObjectTableOutput = buildTableOutput

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(LocationsCommand)
		await super.setup(args, argv, flags)

		this.processNormally(
			args.id,
			() => { return this.client.locations.list() },
			(id) => { return this.client.locations.get(id) },
		)
	}
}
