import { flags } from '@oclif/command'

import { SmartThingsClient } from '@smartthings/core-sdk'
import { BearerTokenAuthenticator } from '@smartthings/core-sdk'

import { SmartThingsCommand } from './smartthings-command'
import { logManager } from './logger'
import { LoginAuthenticator, defaultClientIdProvider } from './login-authenticator'


/**
 * Base class for commands that need to use Rest API commands via the
 * SmartThings Core SDK.
 */
export abstract class APICommand extends SmartThingsCommand {
	static flags = {
		...SmartThingsCommand.flags,
		token: flags.string({
			char: 't',
			description: 'the auth token to use',
			env: 'SMARTTHINGS_TOKEN',
		}),
	}

	protected token?: string
	protected clientIdProvider = defaultClientIdProvider
	private _client?: SmartThingsClient

	protected get client(): SmartThingsClient {
		if (!this._client) {
			throw new Error('APICommand not properly initialized')
		}
		return this._client
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async setup(args: { [name: string]: any }, argv: string[], flags: { [name: string]: any }): Promise<void> {
		await super.setup(args, argv, flags)

		if (flags.token) {
			this.token = flags.token
		} else if ('token' in this.profileConfig) {
			this.token = this.profileConfig.token
		}

		if ('clientIdProvider' in this.profileConfig) {
			this.clientIdProvider = this.profileConfig.clientIdProvider
		}

		const logger = logManager.getLogger('rest-client')

		const authenticator = this.token
			? new BearerTokenAuthenticator(this.token)
			: new LoginAuthenticator(this.profileName, this.clientIdProvider)
		this._client = new SmartThingsClient(authenticator,
			{ urlProvider: this.clientIdProvider, logger })
	}
}
