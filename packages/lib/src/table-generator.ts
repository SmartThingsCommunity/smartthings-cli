import _ from 'lodash'
import Table from 'cli-table'

import { Logger } from '@smartthings/core-sdk'

import { logManager } from './logger'


/**
 * This code is copied from the DefinitelyTyped source code because it is not
 * exported there.
 *
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/cli-table/index.d.ts
 *
 * TODO: open a pull request to export this in DefinitelyTyped
 */
export interface TableOptions {
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
 * Leaving out both label and value is the equivalent of using a simple string
 * for the definition.
 */
export type TableFieldDefinition<T> = string | {
	/**
	 * The name of the property from which to get data. This reference a nested
	 * property if desired.
	 *
	 * The Lodash _.at function is used to access the property but any path
	 * used should return a single value.
	 *
	 * https://lodash.com/docs/4.17.15#at
	 *
	 * The default label is also derived from this field when the `label`
	 * property is not included. Only the final property in the path is used.
	 */
	prop?: string

	/**
	 * If included, the header (column or row depending on the type of table),
	 * will come from label. If not included, it will be the property
	 * name with the first letter made uppercase and spaces added before other
	 * uppercase letters.
	 */
	label?: string

	/**
	 * If included, the displayValue function will be called to get the value
	 * to be displayed. If not, the property of the given name, simply coerced
	 * to a string, will be used.
	 */
	value?: (i: T) => string

	/**
	 * Use this function if you want to optionally include this field.
	 *
	 * If this function is defined and it returns `false`, the field will
	 * be skipped. This really only makes sense in tables that are
	 * "single item" tables where the first column is the label
	 * and the second is the display value (i.e. tables built with
	 * `TableGenerator.buildTableFromItem`.)
	 */
	include?: (i: T) => boolean

	/**
	 * If included and set to true, skip the row if it the value is empty.
	 * This is a shortcut for an `include` method that would just do that
	 * check.
	 */
	skipEmpty?: boolean
}

export interface TableGenerator {
	newOutputTable(options?: Partial<TableOptions>): Table

	/**
	 * Build a table for a specific item. There will be no header and the table
	 * will have two columns. The first displays the label for each property
	 * and the second the associated value.
	 */
	buildTableFromItem<T>(item: T, tableFieldDefinitions: TableFieldDefinition<T>[]): string

	/**
	 * Build a table for a list of items. The first row will be the header row,
	 * displaying labels for all the tableFieldDefinitions and there will be
	 * one row for each item in the items list displaying the associated values.
	 */
	buildTableFromList<T>(items: T[], tableFieldDefinitions: TableFieldDefinition<T>[]): string
}

export class DefaultTableGenerator implements TableGenerator {
	constructor(private compact: boolean) {}

	private _logger?: Logger
	protected get logger(): Logger {
		if (!this._logger) {
			this._logger = logManager.getLogger('table-manager')
		}
		return this._logger
	}

	private convertToLabel(propertyName: string): string {
		// We only use the last field for the name if it's a nested property.
		const propertyNames = propertyName.split('.')
		return propertyNames[propertyNames.length - 1]
			.replace(/([a-z])([A-Z])/g, '$1 $2')
			.replace(/^([a-z])/, text => text.toUpperCase())
			.replace(/\bUri\b/, 'URI')
			.replace(/\bUrl\b/, 'URL')
			.replace(/\bArn\b/, 'ARN')
			.replace(/\bO ?[Aa]uth\b/, 'OAuth')
			.replace(/^Is /, '')
	}

	private getLabelFor<T>(definition: TableFieldDefinition<T>): string {
		if (typeof definition === 'string') {
			return this.convertToLabel(definition)
		}

		if (definition.label) {
			return definition.label
		}

		if (!definition.prop) {
			throw Error('both label and value are required if prop is not specified')
		}

		return this.convertToLabel(definition.prop)
	}
	private getDisplayValueFor<T>(item: T, definition: TableFieldDefinition<T>): string {
		if (!(typeof definition === 'string') && definition.value) {
			return definition.value(item)
		}

		const propertyName = typeof definition === 'string' ? definition : definition.prop
		if (!propertyName) {
			throw Error('both label and value are required if prop is not specified')
		}

		// @ts-ignore
		const matches = _.at(item, propertyName)
		if (matches.length === 0) {
			this.logger.debug(`did not find match for ${propertyName} in ${JSON.stringify(item)}`)
			return ''
		}
		if (matches.length > 1) {
			this.logger.warn(`found more than one match for ${propertyName} in ${JSON.stringify(item)}`)
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return matches.map((value: any ) => value ? value.toString() : '').join(', ')
	}

	newOutputTable(options?: Partial<TableOptions>): Table {
		const configuredOptions = { style: { compact: this.compact }}

		if (options) {
			return new Table({ ...configuredOptions, ...options })
		}
		return new Table(configuredOptions)
	}

	buildTableFromItem<T>(item: T, definitions: TableFieldDefinition<T>[]): string {
		const table = this.newOutputTable()
		for (const definition of definitions) {
			if (typeof definition === 'string'
					|| definition.include === undefined
					|| definition.include(item)) {
				const value = this.getDisplayValueFor(item, definition)
				if (typeof definition === 'string'
						|| !definition.skipEmpty
						|| value) {
					table.push([this.getLabelFor(definition), value])
				}
			}
		}
		return table.toString()
	}

	buildTableFromList<T>(items: T[], definitions: TableFieldDefinition<T>[]): string {
		const headingLabels = definitions.map(def => this.getLabelFor(def))
		const table = this.newOutputTable({ head: headingLabels })
		for (const item of items) {
			table.push(definitions.map(def => this.getDisplayValueFor(item, def)))
		}
		return table.toString()
	}
}
