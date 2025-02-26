import { type Room } from '@smartthings/core-sdk'

import { type WithNamedLocation } from '../../api-helpers.js'
import { type TableFieldDefinition } from '../../table-generator.js'


export const tableFieldDefinitions: TableFieldDefinition<Room>[] = ['name', 'roomId', 'locationId' ]
export const tableFieldDefinitionsWithLocationName: TableFieldDefinition<Room & WithNamedLocation>[] =
	['name', 'roomId', 'location', 'locationId' ]
