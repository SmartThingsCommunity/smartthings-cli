import { flags } from '@oclif/command'
import osLocale from 'os-locale'

import { Authenticator, BearerTokenAuthenticator, SmartThingsClient } from '@smartthings/core-sdk'

import { logManager } from './logger'
import { defaultClientIdProvider, LoginAuthenticator } from './login-authenticator'
import { SmartThingsCommand } from './smartthings-command'


const LANGUAGE_HEADER = 'Accept-Language'
const ORGANIZATION_HEADER = 'X-ST-Organization'

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
		language: flags.string({
			description: 'ISO language code or "NONE" to not specify a language. Defaults to the OS locale',
		}),
	}

	protected token?: string

	private _authenticator?: Authenticator
	get authenticator(): Authenticator {
		if (!this._authenticator) {
			throw new Error('APICommand not properly initialized')
		}
		return this._authenticator
	}

	protected clientIdProvider = defaultClientIdProvider
	private _client?: SmartThingsClient

	get client(): SmartThingsClient {
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

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const headers: { [name: string]: any } = {}

		if (flags.language) {
			if (flags.language !== 'NONE') {
				headers[LANGUAGE_HEADER] = flags.language
			}
		} else {
			headers[LANGUAGE_HEADER] = await osLocale()
		}

		if (flags.organization) {
			headers[ORGANIZATION_HEADER] = flags.organization
		} else if ('organization' in this.profileConfig) {
			headers[ORGANIZATION_HEADER] = this.profileConfig.organization
		}

		this._authenticator = this.token
			? new BearerTokenAuthenticator(this.token)
			: new LoginAuthenticator(this.profileName, this.clientIdProvider)

		this._client = new SmartThingsClient(this._authenticator,
			{ urlProvider: this.clientIdProvider, logger, headers })
	}
}
