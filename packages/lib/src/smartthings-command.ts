import log4js from '@log4js-node/log4js-api'
import { Command, Flags, Interfaces } from '@oclif/core'
import { Input } from '@oclif/core/lib/interfaces'
import { CLIConfig, loadConfig, Profile } from './cli-config'
import { outputFlags } from './output-builder'
import { DefaultTableGenerator, TableGenerator } from './table-generator'


export interface Loggable {
	readonly logger: log4js.Logger
}

/**
 * An interface version of SmartThingsCommand to make its contract easier to mix with other
 * interfaces and to limit what we need to mock for tests.
 */
export interface SmartThingsCommandInterface extends Loggable {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	readonly flags: Interfaces.OutputFlags<any>

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

	readonly tableGenerator: TableGenerator

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
	 * If the configured `keyName` exists and is a string or a string array, return it. (A simple
	 * string will be returned as a single-element array.) Otherwise, return the default value.
	 * This method logs a warning (and returns the default value) if the configured keyName exists
	 * but is not a string or array of strings. (The default `defaultValue` is an empty array.)
	 */
	stringArrayConfigValue(keyName: string, defaultValue?: string[]): string[]

	/**
	 * If the configured `keyName` value exists and is a boolean, return it. Otherwise, return
	 * the default value. This method logs a warning if the configured keyName
	 * exists but is not a boolean.
	 */
	booleanConfigValue(keyName: string, defaultValue?: boolean): boolean

	exit(code?: number): void
}

/**
 * This is needed to get type safety working in derived classes.
 * See https://github.com/oclif/oclif.github.io/pull/142
 */
export type InferredFlagsType<T> = T extends Interfaces.FlagInput<infer F>
	? F & {
		json: boolean | undefined
	}
	: any // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * The command being parsed will not always have {@link outputFlags}.
 * Therefore, we make them all optional to be safely accessible in init below.
 */
type InputFlags = typeof SmartThingsCommand.flags & Partial<typeof outputFlags>

/**
 * The base class for all commands in the SmartThings CLI.
 */
export abstract class SmartThingsCommand<T extends InputFlags> extends Command implements SmartThingsCommandInterface {
	static flags = {
		help: Flags.help({
			char: 'h',
			helpGroup: 'common',
		}),
		profile: Flags.string({
			char: 'p',
			description: 'configuration profile',
			default: 'default',
			env: 'SMARTTHINGS_PROFILE',
			helpGroup: 'common',
		}),
	}

	private _args!: Interfaces.OutputArgs
	private _argv!: string[]
	private _flags!: InferredFlagsType<T>
	private _profile!: Profile
	private _profileName!: string
	private _cliConfig!: CLIConfig
	private _tableGenerator!: TableGenerator
	private _logger!: log4js.Logger

	get args(): Interfaces.OutputArgs {
		return this._args
	}

	/**
	 * Return input arguments, not including flags.
	 */
	get inputArgs(): string[] {
		return this._argv
	}

	get flags(): InferredFlagsType<T> {
		return this._flags
	}

	get profile(): Profile {
		return this._profile
	}

	get profileName(): string {
		return this._profileName
	}

	get cliConfig(): CLIConfig {
		return this._cliConfig
	}

	get tableGenerator(): TableGenerator {
		return this._tableGenerator
	}

	get logger(): log4js.Logger {
		return this._logger
	}

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

	stringArrayConfigValue(keyName: string, defaultValue: string[] = []): string[] {
		if (keyName in this.profile) {
			const configValue = this.profile[keyName]
			if (typeof configValue === 'string') {
				return [configValue]
			}
			if (Array.isArray(configValue) && configValue.every(dir => typeof dir === 'string')) {
				return configValue
			}
			this.logger.warn(`expected string or array of strings for config key ${keyName} but got ${typeof configValue}`)
			return defaultValue
		}
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

	async init(): Promise<void> {
		await super.init()

		this._logger = log4js.getLogger(`cli.${this.ctor.name}`)

		const { args, argv, flags } = await this.parse(this.ctor as Input<T, typeof SmartThingsCommand.globalFlags>)
		this._args = args
		this._argv = argv
		this._flags = flags as unknown as InferredFlagsType<T>

		this._profileName = this.flags.profile || 'default'

		this._cliConfig = await loadConfig({
			configFilename: `${this.config.configDir}/config.yaml`,
			managedConfigFilename: `${this.config.cacheDir}/config-managed.yaml`,
			profileName: this.profileName,
		})

		this._profile = this.cliConfig.profile

		const groupRows = this.flags['no-group-rows']
			? false
			: (this.flags['group-rows'] ? true : this.booleanConfigValue('groupTableOutputRows', true))

		this._tableGenerator = new DefaultTableGenerator(groupRows)
	}

	/**
	 * This method is called when the user has decided to not complete a command.
	 */
	abort(message?: string): void {
		if (message) {
			this.log(message)
		}

		this.exit(0)
	}
}
