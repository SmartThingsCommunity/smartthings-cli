import { Flags } from '@oclif/core'
import osLocale from 'os-locale'
import { Authenticator, BearerTokenAuthenticator, HttpClientHeaders, SmartThingsClient, WarningFromHeader } from '@smartthings/core-sdk'
import { ClientIdProvider, defaultClientIdProvider, LoginAuthenticator } from './login-authenticator'
import { SmartThingsCommand } from './smartthings-command'
import log4js from '@log4js-node/log4js-api'


const LANGUAGE_HEADER = 'Accept-Language'
const ORGANIZATION_HEADER = 'X-ST-Organization'

/**
 * Base class for commands that need to use Rest API commands via the
 * SmartThings Core SDK.
 */
export abstract class APICommand extends SmartThingsCommand {
	static flags = {
		...SmartThingsCommand.flags,
		token: Flags.string({
			char: 't',
			description: 'the auth token to use',
			env: 'SMARTTHINGS_TOKEN',
		}),
		language: Flags.string({
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

	get userAgent(): string {
		return this.config.userAgent ?? '@smartthings/cli'
	}

	private _headers?: HttpClientHeaders
	protected get headers(): HttpClientHeaders {
		if (!this._headers) {
			throw new Error('APICommand not properly initialized')
		}
		return this._headers
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async setup(args: { [name: string]: any }, argv: string[], flags: { [name: string]: any }): Promise<void> {
		await super.setup(args, argv, flags)

		if (flags.token) {
			this.token = flags.token
		} else {
			const configToken = this.stringConfigValue('token')
			if (configToken) {
				this.token = configToken
			}
		}

		const configClientIdProvider = this.profile.clientIdProvider
		if (configClientIdProvider) {
			if (typeof configClientIdProvider !== 'object') {
				this.logger.error('ignoring invalid configClientIdProvider')
			} else {
				this.clientIdProvider = configClientIdProvider as ClientIdProvider
			}
		}

		const logger = log4js.getLogger('rest-client')

		this._headers = { 'User-Agent': this.userAgent }

		if (flags.language) {
			if (flags.language !== 'NONE') {
				this._headers[LANGUAGE_HEADER] = flags.language
			}
		} else {
			this._headers[LANGUAGE_HEADER] = await osLocale()
		}

		if (flags.organization) {
			this._headers[ORGANIZATION_HEADER] = flags.organization
		} else {
			const configOrganization = this.stringConfigValue('organization')
			if (configOrganization) {
				this._headers[ORGANIZATION_HEADER] = configOrganization
			}
		}

		this._authenticator = this.token
			? new BearerTokenAuthenticator(this.token)
			: new LoginAuthenticator(this.profileName, this.clientIdProvider, this.userAgent)

		const warningLogger = (warnings: WarningFromHeader[] | string): void => {
			const message = 'Warnings from API:\n' + (typeof(warnings) === 'string'
				? warnings
				: this.tableGenerator.buildTableFromList(warnings, ['code', 'agent', 'text', 'date']))
			this.logger.warn(message)
			this.warn(message)
		}
		this._client = new SmartThingsClient(this._authenticator,
			{ urlProvider: this.clientIdProvider, logger, headers: this.headers, warningLogger })
	}
}
