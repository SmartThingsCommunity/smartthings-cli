import { Location, LocationItem, SmartThingsClient } from '@smartthings/core-sdk'

import { TableFieldDefinition } from '../../table-generator.js'
import { ChooseFunction, createChooseFn } from './util-util.js'


export const tableFieldDefinitions: TableFieldDefinition<Location>[] = [
	'name', 'locationId', 'countryCode', 'timeZoneId', 'backgroundImage',
	'latitude', 'longitude', 'regionRadius', 'temperatureScale', 'locale',
]

export const chooseLocationFn = (): ChooseFunction<LocationItem> => createChooseFn(
	{
		itemName: 'location',
		primaryKeyName: 'locationId',
		sortKeyName: 'name',
	},
	(client: SmartThingsClient) => client.locations.list(),
)

export const chooseLocation = chooseLocationFn()
