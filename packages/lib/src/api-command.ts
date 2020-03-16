import { flags } from '@oclif/command'

import { SmartThingsClient } from '@smartthings/core-sdk'
import { BearerTokenAuthenticator } from '@smartthings/core-sdk'

import { SmartThingsCommand } from './smartthings-command'
import { cliConfig } from './cli-config'
import { logManager } from './logger'
import { LoginAuthenticator, defaultClientIdProvider } from './login-authenticator'

// Flags common to both input and output.
const commonIOFlags = {
	indent: flags.integer({
		description: 'specify indentation for formatting JSON or YAML output',
	}),
	json: flags.boolean({
		description: 'use JSON format of input and/or output',
		char: 'j',
	}),
	yaml : flags.boolean({
		char: 'y',
		description: 'use YAML format of input and/or output',
	}),
}

const inputFlag = {
	input: flags.string({
		char: 'i',
		description: 'specify input file',
	}),
}

const outputFlag = {
	output : flags.string({
		char: 'o',
		description: 'specify output file',
	}),
}

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

	static inputFlags = {
		...commonIOFlags,
		...inputFlag,
	}

	static outputFlags = {
		...commonIOFlags,
		...outputFlag,
	}

	static inputOutputFlags = {
		...commonIOFlags,
		...inputFlag,
		...outputFlag,
	}

	protected args?: string[]
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected flags?: { [name: string]: any }
	protected token?: string
	protected profileName?: string
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected profileConfig?: { [name: string]: any }
	protected clientIdProvider = defaultClientIdProvider
	protected _client?: SmartThingsClient

	protected get client(): SmartThingsClient {
		if (!this._client) {
			throw new Error('APICommand not properly initialized')
		}
		return this._client
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected async setup(args: string[], flags: { [name: string]: any }): Promise<void> {
		this.args = args
		this.flags = flags

		this.profileName = flags.profile
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
			: new LoginAuthenticator(this.profileName ? this.profileName : 'default',
				this.clientIdProvider)
		this._client = new SmartThingsClient(authenticator,
			{ urlProvider: this.clientIdProvider, logger })
	}
}
