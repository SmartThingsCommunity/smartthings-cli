import { type TableFieldDefinition } from '../../table-generator.js'
import { type InvitationWithAppDetails } from './schema-invites.js'


export const tableFieldDefinitions: TableFieldDefinition<InvitationWithAppDetails>[] = [
	{ prop: 'id', label: 'Invitation Id' },
	'description',
	{
		label: 'Expiration',
		value: (invite) => invite.expiration ? new Date(invite.expiration * 1000).toISOString() : 'none',
	},
	'acceptances',
	'acceptUrl',
	'schemaAppId',
	'schemaAppName',
]
