import { Authenticator, RESTClient, RESTClientConfig } from '@smartthings/core-sdk'

import { InvitesEndpoint } from './endpoints/invites'
import { HttpClientHeaders } from '@smartthings/core-sdk'


export class EdgeClient extends RESTClient {
	public readonly invites: InvitesEndpoint

	constructor(authenticator: Authenticator, config?: RESTClientConfig) {
		super(authenticator, config)

		this.invites = new InvitesEndpoint(this.config)
	}

	public cloneEdge(headers?: HttpClientHeaders): EdgeClient {
		const config: RESTClientConfig = { ...this.config, headers: { ...this.config.headers, ...headers } }
		return new EdgeClient(this.config.authenticator, config)
	}
}
