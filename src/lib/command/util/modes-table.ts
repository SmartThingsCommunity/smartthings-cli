import { type Mode } from '@smartthings/core-sdk'

import { type WithNamedLocation } from '../../api-helpers.js'
import { type TableFieldDefinition } from '../../table-generator.js'


export const tableFieldDefinitions: TableFieldDefinition<Mode>[] = ['label', 'id', 'name']
export const tableFieldDefinitionsWithLocationName: TableFieldDefinition<Mode & WithNamedLocation>[] =
	['label', 'id', 'name', 'location', 'locationId' ]
