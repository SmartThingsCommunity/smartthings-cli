import Command, { flags } from '@oclif/command'

import SmartThingsCommand from './smartthings-command'
import { SmartThingsRESTClient } from '@smartthings/rest-client'
import cliConfig from './lib/cli-config'


/**
 * Base class for Rest API commands.
 */
export default abstract class APICommand extends Command {
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
		'target-environment': flags.string({
			char: 'E',
			description: 'target environment',
			env: 'SMARTTHINGS_ENVIRONMENT'
		}),
	}

	protected args?: string[]
	protected flags?: { [name: string]: any }
	protected token?: string
	protected profileName?: string
	protected profileConfig?: { [name: string]: any }
	protected targetEnvironment?: string
	protected _client?: SmartThingsRESTClient

	protected get client(): SmartThingsRESTClient {
		if (!this._client) {
			throw new Error('APICommand not properly initialized')
		}
		return this._client
	}

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

		if (flags['target-environment']) {
			this.targetEnvironment = flags['target-environment']
		} else if ('targetEnvironment' in this.profileConfig) {
			this.targetEnvironment = this.profileConfig.targetEnvironment
		} else {
			this.targetEnvironment = 'prod'
		}

		this._client = new SmartThingsRESTClient(this.token, this.targetEnvironment)
	}
}
