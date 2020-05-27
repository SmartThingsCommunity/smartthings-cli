import Table from 'cli-table'

import { APICommand } from '@smartthings/cli-lib'

import { Location } from '@smartthings/core-sdk'


export function buildTableOutput(location: Location): string {
	const table = new Table()
	table.push(['Name', location.name])
	table.push(['Id', location.locationId])
	table.push(['Country', location.countryCode])
	table.push(['Timezone', location.timeZoneId])
	table.push(['Background Image', location.backgroundImage])
	table.push(['Latitude, Longitude', location.latitude, location.longitude])
	table.push(['Region Radius', location.regionRadius])
	table.push(['Temperature Scale', location.temperatureScale])
	table.push(['Locale', location.locale])
	table.push(['Additional Properties', location.additionalProperties])
	return table.toString()
}

export default class Locations extends APICommand {
	static description = 'get a specific Location'

	static flags = APICommand.flags

	static args = [{
		name: 'id',
		description: 'the location id',
		required: true,
	}]

	protected buildTableOutput(location: Location): string {
		return buildTableOutput(location)
	}

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(Locations)
		await super.setup(args, argv, flags)

		this.client.locations.get(args.id).then(async location => {
			this.log(JSON.stringify(location, null, 4))
		}).catch(err => {
			this.log(`caught error ${err}`)
		})
	}
}
