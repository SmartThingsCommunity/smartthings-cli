import { Flags } from '@oclif/core'
import osLocale from 'os-locale'
import { Authenticator, BearerTokenAuthenticator, HttpClientHeaders, SmartThingsClient, WarningFromHeader } from '@smartthings/core-sdk'
import { ClientIdProvider, defaultClientIdProvider, LoginAuthenticator } from './login-authenticator'
import { SmartThingsCommand } from './smartthings-command'
import log4js from '@log4js-node/log4js-api'
import { APIOrganizationCommand } from './api-organization-command'


const LANGUAGE_HEADER = 'Accept-Language'
const ORGANIZATION_HEADER = 'X-ST-Organization'

/**
 * The command being parsed will not always have {@link APIOrganizationCommand.flags}.
 * Therefore, we make them all optional to be safely accessible in init below.
 */
type InputFlags = typeof APICommand.flags & Partial<typeof APIOrganizationCommand.flags>

/**
 * Base class for commands that need to use Rest API via the SmartThings Core SDK.
 */
export abstract class APICommand<T extends InputFlags> extends SmartThingsCommand<T> {
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

	protected clientIdProvider = defaultClientIdProvider
	protected token?: string
	private _authenticator!: Authenticator
	private _client!: SmartThingsClient
	private _headers!: HttpClientHeaders

	get authenticator(): Authenticator {
		return this._authenticator
	}

	get client(): SmartThingsClient {
		return this._client
	}

	protected get headers(): HttpClientHeaders {
		return this._headers
	}

	get userAgent(): string {
		return this.config.userAgent ?? '@smartthings/cli'
	}

	async init(): Promise<void> {
		await super.init()

		if (this.flags.token) {
			this.token = this.flags.token
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

		if (this.flags.language) {
			if (this.flags.language !== 'NONE') {
				this._headers[LANGUAGE_HEADER] = this.flags.language
			}
		} else {
			this._headers[LANGUAGE_HEADER] = await osLocale()
		}

		if (this.flags.organization) {
			this._headers[ORGANIZATION_HEADER] = this.flags.organization
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
