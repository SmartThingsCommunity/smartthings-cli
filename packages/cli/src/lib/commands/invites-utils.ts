import { SchemaAppInvitation, SmartThingsClient } from '@smartthings/core-sdk'

import {
	APICommand,
	ChooseOptions,
	chooseOptionsWithDefaults,
	selectFromList,
	SelectFromListConfig,
	stringTranslateToId,
	TableFieldDefinition,
} from '@smartthings/cli-lib'
import { chooseSchemaApp } from './schema-util'


export const chooseSchemaInvitation = async (command: APICommand<typeof APICommand.flags>, schemaAppFromArgs?: string, invitationFromArg?: string, options?: Partial<ChooseOptions<SchemaAppInvitation>>): Promise<string> => {
	const opts = chooseOptionsWithDefaults(options)
	const config: SelectFromListConfig<SchemaAppInvitation> = {
		itemName: 'schema app invitation',
		primaryKeyName: 'id',
		sortKeyName: 'description',
	}
	const listItems = async (): Promise<SchemaAppInvitation[]> => {
		const schemaAppId = await chooseSchemaApp(command, schemaAppFromArgs)
		return command.client.invitesSchema.list(schemaAppId)
	}
	const preselectedId = opts.allowIndex
		? await stringTranslateToId(config, invitationFromArg, listItems)
		: invitationFromArg
	return selectFromList(command, config, { preselectedId, listItems })
}

export const inviteTableFieldDefinitions: TableFieldDefinition<SchemaAppInvitation>[] = [
	'id',
	'description',
	{
		label: 'Expiration',
		value: (invite) => invite.expiration ? new Date(invite.expiration * 1000).toISOString() : 'none',
	},
	'acceptUrl',
	'shortCode',
]

/**
 * Since there is no API to get a single invitation, this function uses the list function to get all
 * invites for a given schema app and then returns the one specified by the `id` parameter.
 */
export const getSingleInvite = async (client: SmartThingsClient, schemaAppId: string | undefined, id: string): Promise<SchemaAppInvitation> => {
	const findInvitation = async (schemaAppId: string): Promise<SchemaAppInvitation | undefined> =>
		(await client.invitesSchema.list(schemaAppId)).find(invite => invite.id === id)

	if (schemaAppId) {
		const retVal = await findInvitation(schemaAppId)
		if (retVal) {
			return retVal
		}
	} else {
		const schemaApps = await client.schema.list()
		for (const schemaApp of schemaApps) {
			if (schemaApp.endpointAppId == null) {
				continue
			}
			const retVal = await findInvitation(schemaApp.endpointAppId)
			if (retVal) {
				return retVal
			}
		}
	}

	throw Error(`could not find invitation ${id}`)
}
