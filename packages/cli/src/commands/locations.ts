import { Location, LocationItem } from '@smartthings/core-sdk'

import { APICommand, outputItemOrList, OutputItemOrListConfig, selectFromList, SelectFromListConfig, stringTranslateToId, TableFieldDefinition } from '@smartthings/cli-lib'


export const tableFieldDefinitions: TableFieldDefinition<Location>[] = [
	'name', 'locationId', 'countryCode', 'timeZoneId', 'backgroundImage',
	'latitude', 'longitude', 'regionRadius', 'temperatureScale', 'locale',
]

export async function chooseLocation(
		command: APICommand<typeof APICommand.flags>,
		locationFromArg?: string,
		autoChoose?: boolean,
		allowIndex?: boolean): Promise<string> {
	const config: SelectFromListConfig<LocationItem> = {
		itemName: 'location',
		primaryKeyName: 'locationId',
		sortKeyName: 'name',
	}

	const listItems = (): Promise<LocationItem[]> => command.client.locations.list()

	const preselectedId = allowIndex
		? await stringTranslateToId(config, locationFromArg, listItems)
		: locationFromArg

	return selectFromList(command, config, {
		preselectedId,
		autoChoose,
		listItems,
	})
}

export default class LocationsCommand extends APICommand<typeof LocationsCommand.flags> {
	static description = 'list locations or get information for a specific Location'

	static flags = {
		...APICommand.flags,
		...outputItemOrList.flags,
	}

	static args = [{
		name: 'idOrIndex',
		description: 'the location id or number in list',
	}]

	async run(): Promise<void> {
		const config: OutputItemOrListConfig<Location, LocationItem> = {
			primaryKeyName: 'locationId',
			sortKeyName: 'name',
			tableFieldDefinitions,
		}
		await outputItemOrList<Location, LocationItem>(this, config, this.args.idOrIndex,
			() => this.client.locations.list(),
			id => this.client.locations.get(id))
	}
}
