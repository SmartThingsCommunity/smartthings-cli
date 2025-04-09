import { type EndpointClientConfig } from '@smartthings/core-sdk'

import { newEndpointClient } from '../../command/util/st-client-wrapper.js'


// A temporary endpoint for accessing the temporary `invites` endpoints while we wait for the real ones.

export type InvitationMetadata = {
	name: string
	description: string
	owner: string
	termsUrl: string
}

export type InvitationCreate = {
	resource: {
		root: {
			service: 'core' | 'iam' | 'platform' | 'mdu' | 'developer'
			id?: string
		}
		components: {
			kind:
				| 'root'
				| 'location'
				| 'device'
				| 'user'
				| 'property'
				| 'group'
				| 'role'
				| 'policy'
				| 'unit'
				| 'partner'
				| 'installedapp'
				| 'channel'
				| 'deviceprofile'
				| 'namespace'
				| 'driver'
			id: string
		}[]
	}
	profileId: string
	metadata: InvitationMetadata

	/**
	 * optional expiration in seconds from the epoch
	 */
	expiration?: number
}

export type Invitation = InvitationCreate & {
	id: string
	acceptUrl: string
}

export type InvitationSummary = {
	invitationId: string
	acceptUrl: string
}

export type InvitesEndpoint = {
	create(invitation: InvitationCreate): Promise<InvitationSummary>
	get(id: string): Promise<Invitation>
	list(channelId: string): Promise<Invitation[]>
	delete(id: string): Promise<void>
	accept(id: string): Promise<void>
}

export const invitesEndpoint = (config: EndpointClientConfig): InvitesEndpoint => {
	const client = newEndpointClient('invites', config)
	return {
		create: async (invitation: InvitationCreate): Promise<InvitationSummary> =>
			client.post('', invitation),
		get: async (id: string): Promise<Invitation> => client.get(id),
		list: async (channelId: string): Promise<Invitation[]> =>
			client.getPagedItems('', { resource: `st1:developer::channel/${channelId}` }),
		delete: async (id: string): Promise<void> => await client.delete(id),
		accept: async (id: string): Promise<void> => await client.put(`${id}/accept`),
	}
}
