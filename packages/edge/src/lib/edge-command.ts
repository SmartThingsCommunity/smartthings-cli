import log4js from '@log4js-node/log4js-api'
import { APIOrganizationCommand } from '@smartthings/cli-lib'

import { EdgeClient } from './edge-client'


export abstract class EdgeCommand<T extends typeof EdgeCommand.flags> extends APIOrganizationCommand<T> {
	static flags = APIOrganizationCommand.flags

	private _edgeClient!: EdgeClient

	get edgeClient(): EdgeClient {
		return this._edgeClient
	}

	async init(): Promise<void> {
		await super.init()

		const logger = log4js.getLogger('rest-client')
		this._edgeClient = new EdgeClient(this.authenticator,
			{ urlProvider: this.clientIdProvider, logger, headers: this.client.config.headers })
	}
}
