import { type TableFieldDefinition } from '../../table-generator.js'
import { type Invitation } from '../../edge/endpoints/invites.js'


export const listTableFieldDefinitions: TableFieldDefinition<Invitation>[] = [
	'id',
	{ path: 'metadata.name' },
	{ label: 'Channel Id', path: 'resource.components[0].id' },
	{
		label: 'Expiration',
		value: ({ expiration }) => expiration ? new Date(expiration * 1000).toISOString() : '',
	},
	'acceptUrl',
]
export const tableFieldDefinitions: TableFieldDefinition<Invitation>[] = [
	...listTableFieldDefinitions,
	'profileId',
]
