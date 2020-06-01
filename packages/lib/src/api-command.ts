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
	protected async setup(args: { [name: string]: any }, argv: string[], flags: { [name: string]: any }): Promise<void> {
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

/**
 * TODO: most or all classes that use this should be updated soon to use
 * `StringSelectingInputAPICommand` (or in a few cases `SelectingInputAPICommand`).
 */
export abstract class SimpleAPICommand extends APICommand {
	/**
	 * This is just a convenience method that outputs a simple string message
	 * on success and handles exceptions. This is mostly useful for simple
	 * things like a DELETE call that don't have any complicated inputs or
	 * outputs.
	 *
	 * @param executeCommand function that does the work
	 */
	protected processNormally(successMessage: string, makeRequest: () => Promise<void>): void {
		makeRequest().then(() => {
			process.stdout.write(`${successMessage}\n`)
		}).catch(err => {
			this.logger.error(`caught error ${err}`)
			this.exit(1)
		})
	}
}
