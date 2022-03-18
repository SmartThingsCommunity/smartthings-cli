import { Command, Flags } from '@oclif/core'

import { Logger } from '@smartthings/core-sdk'

import { CLIConfig, loadConfig, Profile } from './cli-config'
import { logManager } from './logger'
import { DefaultTableGenerator, TableGenerator } from './table-generator'


export interface Loggable {
	readonly logger: Logger
}

/**
 * An interface version of SmartThingsCommand to make its contract easier to mix with other
 * interfaces and to limit what we need to mock for tests.
 */
export interface SmartThingsCommandInterface extends Loggable {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	readonly flags: { [name: string]: any }

	/**
	 * The full configuration set, including both user-configured and cli-managed configuration
	 * values and all profiles. Most often you will just want to use `profile` instead.
	 *
	 * Named `cliConfig` to distinguish it from the `config` inherited from oclif's `Command`.
	 */
	readonly cliConfig: CLIConfig

	/**
	 * The configuration set for the selected profile.
	 */
	readonly profile: Profile

	// convenience methods for safely accessing configuration values

	/**
	 * If the configured `keyName` value exists and is a string, return it. Otherwise, return
	 * the default value. This method logs a warning (and returns the default value) if the
	 * configured keyName exists but is not a string. (The default `defaultValue` is `undefined`.)
	 */
	stringConfigValue(keyName: string): string | undefined
	stringConfigValue(keyName: string, defaultValue: string): string
	stringConfigValue(keyName: string, defaultValue?: string): string | undefined

	/**
	 * If the configured `keyName` value exists and is a boolean, return it. Otherwise, return
	 * the default value. This method logs a warning if the configured keyName
	 * exists but is not a boolean.
	 */
	booleanConfigValue(keyName: string, defaultValue?: boolean): boolean

	readonly tableGenerator: TableGenerator

	exit(code?: number): void
}

/**
 * The base class for all commands in the SmartThings CLI.
 */
export abstract class SmartThingsCommand extends Command implements SmartThingsCommandInterface {
	static flags = {
		help: Flags.help({ char: 'h' }),
		profile: Flags.string({
			char: 'p',
			description: 'configuration profile',
			default: 'default',
			env: 'SMARTTHINGS_PROFILE',
		}),
	}

	// TODO: consider using Map<String, any> here and elsewhere (see api-helper for example)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private _args?: { [name: string]: any }
	private _argv?: string[]
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private _flags?: { [name: string]: any }

	private _logger?: Logger
	get logger(): Logger {
		if (!this._logger) {
			this._logger = logManager.getLogger('cli')
		}
		return this._logger
	}

	private _profileName?: string

	private _profile?: Profile
	get profile(): Profile {
		if (!this._profile) {
			throw new Error('SmartThingsCommand not properly initialized')
		}
		return this._profile
	}

	cliConfig!: CLIConfig

	stringConfigValue(keyName: string): string
	stringConfigValue(keyName: string, defaultValue: string): string
	stringConfigValue(keyName: string, defaultValue?: string): string | undefined {
		if (keyName in this.profile) {
			const configValue = this.profile[keyName]
			if (typeof configValue === 'string') {
				return configValue
			}
			this.logger.warn(`expected string value for config key ${keyName} but got ${typeof this.profile[keyName]}`)
			return defaultValue
		}
		this.logger.trace(`key ${keyName} not found in ${this.profileName} config`)
		return defaultValue
	}

	booleanConfigValue(keyName: string, defaultValue = false): boolean {
		if (keyName in this.profile) {
			const configValue = this.profile[keyName]
			if (typeof configValue === 'boolean') {
				return configValue
			}
			this.logger.warn(`expected boolean value for config key ${keyName} but got ${typeof this.profile[keyName]}`)
			return defaultValue
		}
		this.logger.trace(`key ${keyName} not found in ${this.profileName} config`)
		return defaultValue
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	get args(): { [name: string]: any } {
		if (!this._args) {
			throw new Error('SmartThingsCommand not properly initialized')
		}
		return this._args
	}

	/**
	 * Return input arguments, not including flags.
	 */
	get inputArgs(): string[] {
		if (!this._argv) {
			throw new Error('SmartThingsCommand not properly initialized')
		}
		return this._argv
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	get flags(): { [name: string]: any } {
		if (!this._flags) {
			throw new Error('SmartThingsCommand not properly initialized')
		}
		return this._flags
	}

	get profileName(): string {
		if (!this._profileName) {
			throw new Error('SmartThingsCommand not properly initialized')
		}
		return this._profileName
	}

	protected _tableGenerator?: TableGenerator
	get tableGenerator(): TableGenerator {
		if (!this._tableGenerator) {
			throw new Error('SmartThingsCommand not properly initialized')
		}
		return this._tableGenerator
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async setup(args: { [name: string]: any }, argv: string[], flags: { [name: string]: any }): Promise<void> {
		this._args = args
		this._argv = argv
		this._flags = flags

		this._profileName = flags.profile || 'default'

		this.cliConfig = await loadConfig({
			configFilename: `${this.config.configDir}/config.yaml`,
			managedConfigFilename: `${this.config.cacheDir}/config-managed.yaml`,
			profileName: this.profileName,
		})
		this._profile = this.cliConfig.profile

		const compact = this.flags.expanded
			? false
			: (this.flags.compact ? true : this.booleanConfigValue('compactTableOutput', true))
		this._tableGenerator = new DefaultTableGenerator(compact)
	}

	/**
	 * This method should be called when the user has decided to not complete a command.
	 */
	abort(message?: string): never {
		if (message) {
			this.log(message)
		}
		// eslint-disable-next-line no-process-exit
		process.exit(0)
	}
}
