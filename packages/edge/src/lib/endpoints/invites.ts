import { Endpoint, EndpointClient, EndpointClientConfig } from '@smartthings/core-sdk'


export type InvitationMetadata = {
	name: string
	description: string
	owner: string
	termsUrl: string
}

export type CreateInvitation = {
	resource: {
		root: {
			service: 'core' | 'iam' | 'platform' | 'mdu' | 'developer'
			id?: string
		}
		components: {
			kind: 'root' | 'location' | 'device' | 'user' | 'property' | 'group' | 'role' | 'policy' | 'unit' | 'partner' | 'installedapp' | 'channel' | 'deviceprofile' | 'namespace' | 'driver'
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

export type Invitation = CreateInvitation & {
	id: string
	acceptUrl: string
}

export type InvitationSummary = {
	invitationId: string
	acceptUrl: string
}


export class InvitesEndpoint extends Endpoint {
	constructor(config: EndpointClientConfig) {
		super(new EndpointClient('invites', config))
	}

	public async create(invitation: CreateInvitation): Promise<InvitationSummary> {
		return this.client.post('', invitation)
	}

	public async get(id: string): Promise<Invitation> {
		return this.client.get(id)
	}

	public async list(channelId: string): Promise<Invitation[]> {
		return this.client.getPagedItems('', { resource: `st1:developer::channel/${channelId}` })
	}

	public async delete(id: string): Promise<void> {
		await this.client.delete(id)
	}

	public async accept(id: string): Promise<void> {
		await this.client.put(`${id}/accept`)
	}
}
