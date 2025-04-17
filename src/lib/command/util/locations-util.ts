import { type Location, type LocationItem } from '@smartthings/core-sdk'

import { type TableFieldDefinition } from '../../table-generator.js'
import { type ChooseFunction, createChooseFn } from './util-util.js'


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
	command => command.client.locations.list(),
)

export const chooseLocation = chooseLocationFn()
