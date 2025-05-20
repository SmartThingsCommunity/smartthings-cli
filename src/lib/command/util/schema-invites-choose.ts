import { SchemaAppInvitation } from '@smartthings/core-sdk'

import { chooseSchemaApp } from './schema-util.js'
import { type ChooseFunction, createChooseFn } from './util-util.js'


export const chooseSchemaInvitationFn = (
		schemaAppFromArgs: string | undefined,
): ChooseFunction<SchemaAppInvitation> => createChooseFn(
	{
		itemName: 'Schema App invitation',
		primaryKeyName: 'id',
		sortKeyName: 'description',
	},
	async command => {
		const schemaAppId = await chooseSchemaApp(command, schemaAppFromArgs, { autoChoose: true })
		return command.client.invitesSchema.list(schemaAppId)
	},
)
