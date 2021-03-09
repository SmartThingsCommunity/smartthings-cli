import Command, { flags } from '@oclif/command'

import { Logger } from '@smartthings/core-sdk'

import { cliConfig } from './cli-config'
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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	readonly profileConfig: { [name: string]: any }
	readonly tableGenerator: TableGenerator

	exit(code?: number): never
}

/**
 * The base class for all commands in the SmartThings CLI.
 */
export abstract class SmartThingsCommand extends Command implements SmartThingsCommandInterface {
	static flags = {
		help: flags.help({ char: 'h' }),
		profile: flags.string({
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

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private _profileConfig?: { [name: string]: any }
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	get profileConfig(): { [name: string]: any } {
		if (!this._profileConfig) {
			throw new Error('SmartThingsCommand not properly initialized')
		}
		return this._profileConfig
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
		this._profileConfig = cliConfig.getProfile(flags.profile)

		let compact = true
		if ('compactTableOutput' in this.profileConfig) {
			compact = this.profileConfig.compactTableOutput
		}
		if (this.flags.expanded) {
			compact = false
		} else if (this.flags.compact) {
			compact = true
		}
		this._tableGenerator = new DefaultTableGenerator(compact)
	}

	abort(message?: string): void {
		if (message) {
			this.log(message)
		}
		// eslint-disable-next-line no-process-exit
		process.exit(0)
	}
}
