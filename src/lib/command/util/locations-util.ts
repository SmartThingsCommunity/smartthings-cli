import { Location, SmartThingsClient } from '@smartthings/core-sdk'

import { TableFieldDefinition } from '../../table-generator.js'
import { createChooseFn } from './util-util.js'


export const tableFieldDefinitions: TableFieldDefinition<Location>[] = [
	'name', 'locationId', 'countryCode', 'timeZoneId', 'backgroundImage',
	'latitude', 'longitude', 'regionRadius', 'temperatureScale', 'locale',
]

export const chooseLocation = createChooseFn(
	{
		itemName: 'location',
		primaryKeyName: 'locationId',
		sortKeyName: 'name',
	},
	(client: SmartThingsClient) => client.locations.list(),
)
