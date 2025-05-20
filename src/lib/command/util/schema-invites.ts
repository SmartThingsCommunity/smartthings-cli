import { type SchemaApp, type SchemaAppInvitation, type SmartThingsClient } from '@smartthings/core-sdk'


export type InvitationWithAppDetails = SchemaAppInvitation & {
	schemaAppId?: string
	schemaAppName?: string
	sort: string
}

export const addAppDetails = (invite: SchemaAppInvitation, app: SchemaApp): InvitationWithAppDetails => ({
	...invite,
	schemaAppName: app.appName,
	// In future we should make it so we can sort by multiple fields.
	sort: `${app.appName ?? ''}:${invite.schemaAppId} ${invite.description ?? ''}:${invite.id}`,
})

/**
 * Since there is no API to get a single invitation, this function uses the list function to get all
 * invites for a given schema app and then returns the one specified by the `id` parameter.
 */
export const getSingleInvite = async (
		client: SmartThingsClient,
		schemaAppId: string | undefined,
		id: string,
): Promise<InvitationWithAppDetails> => {
	const findInvitation = async (schemaAppId: string): Promise<SchemaAppInvitation | undefined> =>
		(await client.invitesSchema.list(schemaAppId)).find(invite => invite.id === id)

	if (schemaAppId) {
		const invite = await findInvitation(schemaAppId)
		if (invite) {
			return addAppDetails(invite, await client.schema.get(invite.schemaAppId))
		}
	} else {
		const schemaApps = await client.schema.list()
		for (const schemaApp of schemaApps) {
			if (schemaApp.endpointAppId == null) {
				continue
			}
			const invite = await findInvitation(schemaApp.endpointAppId)
			if (invite) {
				return addAppDetails(invite, schemaApp)
			}
		}
	}

	throw Error(`could not find invitation ${id}`)
}
