import { flags } from '@oclif/command'

import { SmartThingsClient } from '@smartthings/core-sdk'
import { BearerTokenAuthenticator } from '@smartthings/core-sdk'

import { SmartThingsCommand } from './smartthings-command'
import { cliConfig } from './cli-config'
import { logManager } from './logger'
import { LoginAuthenticator, defaultClientIdProvider } from './login-authenticator'


/**
 * Base class for Rest API commands.
 */
export abstract class APICommand extends SmartThingsCommand {
	static flags = {
		...SmartThingsCommand.flags,
		profile: flags.string({
			char: 'p',
			description: 'configuration profile',
			default: 'default',
			env: 'SMARTTHINGS_PROFILE',
		}),
		token: flags.string({
			char: 't',
			description: 'the auth token to use',
			env: 'SMARTTHINGS_TOKEN',
		}),
	}

	private _argv?: string[]
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private _flags?: { [name: string]: any }
	protected token?: string
	private _profileName?: string
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected profileConfig?: { [name: string]: any }
	protected clientIdProvider = defaultClientIdProvider
	private _client?: SmartThingsClient

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected get flags(): { [name: string]: any } {
		if (!this._flags) {
			throw new Error('APICommand not properly initialized')
		}
		return this._flags
	}

	protected get profileName(): string {
		if (!this._profileName) {
			throw new Error('APICommand not properly initialized')
		}
		return this._profileName
	}

	protected get client(): SmartThingsClient {
		if (!this._client) {
			throw new Error('APICommand not properly initialized')
		}
		return this._client
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected async setup(args: { [name: string]: any }, argv: string[], flags: { [name: string]: any }): Promise<void> {
		this._argv = argv
		this._flags = flags

		this._profileName = flags.profile || 'default'
		this.profileConfig = cliConfig.getProfile(flags.profile)

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
