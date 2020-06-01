import Table from 'cli-table'
import Command, { flags } from '@oclif/command'

import { Logger } from '@smartthings/core-sdk'

import { cliConfig } from './cli-config'
import { logManager } from './logger'


/**
 * This code is copied from the DefinitelyTyped source code because it is not
 * exported there.
 *
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/cli-table/index.d.ts
 *
 * TODO: open a pull request to export this in DefinitelyTyped
 */
interface TableOptions {
	chars: Partial<Record<(
		'top' |
		'top-mid' |
		'top-left' |
		'top-right' |
		'bottom' |
		'bottom-mid' |
		'bottom-left' |
		'bottom-right' |
		'left' |
		'left-mid' |
		'mid' |
		'mid-mid' |
		'right' |
		'right-mid' |
		'middle'
	), string>>
	truncate: string
	colors: boolean
	colWidths: number[]
	colAligns: Array<'left' | 'middle' | 'right'>
	style: Partial<{
		'padding-left': number
		'padding-right': number
		head: string[]
		border: string[]
		compact: boolean
	}>
	head: string[]
}

/**
 * Used to define a field in an output table.
 *
 * If the name of the property can programmatically be converted to the name
 * of the header, a simple string can be used. For example, if the name of
 * the field is "maxValue", using the string "maxValue" here will result
 * in a heading name of "Max Value" and data is retrieved simply from the
 * "maxValue" property.
 *
 * If more control is needed, a more complex definition can be included.
 *
 * Leaving out both headingName and displayValue is the equivalent of
 * using a simple string for the definition.
 */
export type TableFieldDefinition<T> = string | {
	/**
	 * The required propertyName simply defines the name of the property from
	 * which to get data.
	 */
	propertyName: string

	/**
	 * If included, the header (column or row depending on the type of table),
	 * will come from headingName. If not included, it will be the property
	 * name with the first letter made uppercase and spaces added before other
	 * uppercase letters.
	 */
	headingName?: string

	/**
	 * If included, the displayValue function will be called to get the value
	 * to be displayed. If not, the property of the given name, simply coerced
	 * to a string, will be used.
	 */
	displayValue?: (i: T) => string

	/**
	 * Include this function if you want to optionally include this field.
	 *
	 * If this function is included and it returns `false`, the field will
	 * be skipped. This field really only makes sense in tables that are
	 * displaying two columns where the first column is the heading name
	 * and the second is the display value.
	 * TODO: update previous sentence with correct terms
	 *   that is terms used in TableGenerator below
	 */
	include?: (i: T) => boolean
}

export interface TableGenerator {
	newOutputTable(options?: Partial<TableOptions>): Table
	// TODO: add more methods here like:
	// buildTableFromItem<T>(item: T, tableFieldDefinitions: TableFieldDefinitions<T>[])
	// buildTableFromList<T>(items: T[], tableFieldDefinitions: TableFieldDefinitions<T>[])
}

/**
 * The base class for all commands in the SmartThings CLI.
 */
export abstract class SmartThingsCommand extends Command implements TableGenerator {
	static flags = {
		help: flags.help({ char: 'h' }),
		profile: flags.string({
			char: 'p',
			description: 'configuration profile',
			default: 'default',
			env: 'SMARTTHINGS_PROFILE',
		}),
	}

	private _argv?: string[]
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private _flags?: { [name: string]: any }

	private _logger?: Logger
	protected get logger(): Logger {
		if (!this._logger) {
			this._logger = logManager.getLogger('cli')
		}
		return this._logger
	}

	private _profileName?: string

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private _profileConfig?: { [name: string]: any }
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected get profileConfig(): { [name: string]: any } {
		if (!this._profileConfig) {
			throw new Error('SmartThingsCommand not properly initialized')
		}
		return this._profileConfig
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected get flags(): { [name: string]: any } {
		if (!this._flags) {
			throw new Error('SmartThingsCommand not properly initialized')
		}
		return this._flags
	}

	protected get profileName(): string {
		if (!this._profileName) {
			throw new Error('SmartThingsCommand not properly initialized')
		}
		return this._profileName
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected async setup(args: { [name: string]: any }, argv: string[], flags: { [name: string]: any }): Promise<void> {
		this._argv = argv
		this._flags = flags

		this._profileName = flags.profile || 'default'
		this._profileConfig = cliConfig.getProfile(flags.profile)
	}

	newOutputTable(options?: Partial<TableOptions>): Table {
		let compact = true
		if ('compactTableOutput' in this.profileConfig) {
			compact = this.profileConfig.compactTableOutput
		}
		if (this.flags.expanded) {
			compact = false
		} else if (this.flags.compact) {
			compact = true
		}

		const configuredOptions = { style: { compact }}

		if (options) {
			return new Table({ ...configuredOptions, ...options })
		}
		return new Table(configuredOptions)
	}
}
