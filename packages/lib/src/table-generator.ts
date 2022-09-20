import log4js from '@log4js-node/log4js-api'
import at from 'lodash.at'
import { table } from 'table'

import { Logger } from '@smartthings/core-sdk'


export const summarizedText = '(Information is summarized, for full details use YAML, -y, or JSON flag, -j.)'

interface TableFieldDefinitionBase<T extends object> {
	/**
	 * If included, overrides the default label for the column.
	 */
	label?: string

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
	 * check. Like include, this is only valid for single-item tables.
	 */
	skipEmpty?: boolean
}

/**
 * Simplest table field definition that specifies a property name as the definition.
 *
 * The label for the field will be derived from the name of the property.
 */
export type SimpleTableFieldDefinition<T extends object> = keyof T

/**
 * A `TableFieldDefinition` where the property is specified as a direct property
 * of the input type.
 *
 * The default label (when not overridden with the `label` option) is the string version of `prop`
 * with the first letter made uppercase and spaces added before other uppercase letters.
 */
export interface PropertyTableFieldDefinition<T extends object> extends TableFieldDefinitionBase<T> {
	/**
	 * The name of the property from which to get data.
	 */
	prop: keyof T
}

/**
 * A `TableFieldDefinition` where the property is specified as a string given to the `lodash.at`
 * method.
 *
 * The default label is also derived from the final property of the path when the `label` option is
 * not included.
 */
export interface PathTableFieldDefinition<T extends object> extends TableFieldDefinitionBase<T> {
	/**
	 * The lodash path of property from which to get data. This is used to reference a nested
	 * property. If you want to reference a non-nested property use `PropertyTableFieldDefinition`
	 * or even `SimpleTableFieldDDefinition` instead.
	 *
	 * The lodash.at function is used to access the property but any path
	 * used should return a single value.
	 *
	 * https://lodash.com/docs#at
	 */
	path: `${Extract<keyof T, string>}.${string}`
}

/**
 * If a simple property is not good enough to specify the value, you can use this
 * `TableFieldDefinition` to specify a function which calculates the value of the field. Note
 * that for this type of `TableFieldDefinition`, the `label` option is required.
 */
export interface ValueTableFieldDefinition<T extends object> extends TableFieldDefinitionBase<T> {
	/**
	 * If included, overrides the default label for the column.
	 */
	label: string

	/**
	 * If included, the displayValue function will be called to get the value
	 * to be displayed. If not, the property of the given name, coerced
	 * to a string, will be used.
	 */
	value: (i: T) => string | undefined
}

/**
 * Used to define a field in an output table.
 *
 * If the name of the property can programmatically be converted to the name
 * of the header, a simple string can be used. For example, if the name of
 * the field is "maxValue", using the string "maxValue" here will result
 * in a heading name of "Max Value" and data is retrieved from the "maxValue" property.
 *
 * If more control is needed, a more complex definition can be included.
 *
 * Leaving out both label and value is the equivalent of using a simple string
 * for the definition.
 */
export type TableFieldDefinition<T extends object> = SimpleTableFieldDefinition<T> | PropertyTableFieldDefinition<T> | PathTableFieldDefinition<T> | ValueTableFieldDefinition<T>

export interface TableGenerator {
	newOutputTable(options?: Partial<TableOptions>): Table

	/**
	 * Build a table for a specific item. There will be no header and the table
	 * will have two columns. The first displays the label for each property
	 * and the second the associated value.
	 */
	buildTableFromItem<T extends object>(item: T, tableFieldDefinitions: TableFieldDefinition<T>[]): string

	/**
	 * Build a table for a list of items. The first row will be the header row,
	 * displaying labels for all the tableFieldDefinitions and there will be
	 * one row for each item in the items list displaying the associated values.
	 */
	buildTableFromList<T extends object>(items: T[], tableFieldDefinitions: TableFieldDefinition<T>[]): string
}

export interface TableOptions {
	/**
	 * Separate groups of four rows by a line to make long rows easier to follow across the screen.
	 */
	groupRows: boolean
	head: string[]
	isList?: boolean
}

export const stringFromUnknown = (input: unknown): string => {
	if (typeof input === 'string') {
		return input
	}
	if (input == undefined) {
		return ''
	}
	if (typeof input === 'function') {
		return '<Function>'
	}
	if (typeof input === 'number' || typeof input == 'boolean' || typeof input === 'bigint' ||
			typeof input === 'symbol') {
		return input.toString()
	}
	if (typeof input === 'object') {
		// For object, only use the toString if it's not the default
		if (input.toString !== Object.prototype.toString) {
			return input.toString()
		}
	}
	return JSON.stringify(input)
}

export type TableCellData = string | number | boolean | undefined
export interface Table {
	push: (row: TableCellData[]) => void

	toString: () => string
}

class TableAdapter implements Table {
	private data: string[][] = []
	private hasHeaderRow: boolean

	push(row: TableCellData[]): void {
		this.data.push(row.map(cell => cell?.toString() ?? ''))
	}

	constructor(private options: Partial<TableOptions>) {
		this.hasHeaderRow = options.head != undefined
		if (options.head) {
			this.data.push(options.head)
		}
	}

	toString(): string {
		const border = {
			topBody: '─',
			topJoin: '',
			topLeft: '',
			topRight: '',

			bottomBody: '─',
			bottomJoin: '',
			bottomLeft: '',
			bottomRight: '',

			bodyLeft: '',
			bodyRight: '',
			bodyJoin: '',

			joinBody: '─',
			joinLeft: '',
			joinRight: '',
			joinJoin: '',
		}

		const listDrawHorizontalLine = this.options.groupRows
			? (index: number) => index === 0 || index === this.data.length || (index - 1) % 5 === 0
			: (index: number) => index === 0 || index === this.data.length || index === 1
		const drawHorizontalLine = this.options.isList
			? listDrawHorizontalLine
			: (index: number) => index === 0 || index === this.data.length
		const config = { drawHorizontalLine, border }
		return table(this.data, config)
	}
}

export class DefaultTableGenerator implements TableGenerator {
	constructor(private groupRows: boolean) {}

	private _logger?: Logger
	protected get logger(): Logger {
		if (!this._logger) {
			this._logger = log4js.getLogger('table-manager')
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

	private getLabelFor<T extends object>(definition: TableFieldDefinition<T>): string {
		if (typeof definition !== 'object') {
			return this.convertToLabel(definition.toString())
		}

		if (definition.label) {
			return definition.label
		}

		if ('value' in definition) {
			return definition.label
		}

		if ('prop' in definition) {
			return this.convertToLabel(definition.prop.toString())
		}

		return this.convertToLabel(definition.path)
	}

	private getDisplayValueFor<T extends object>(item: T, definition: TableFieldDefinition<T>): string | undefined {
		if (typeof definition === 'object' && 'value' in definition) {
			return definition.value(item)
		}

		if (typeof definition !== 'object' || 'prop' in definition) {
			const propertyName = typeof definition !== 'object' ? definition : definition.prop
			return stringFromUnknown(item[propertyName])
		}

		// The DefinitelyTyped type for the second parameter doesn't match what lodash actually
		// takes so we cast it to the DefinitelyTyped type.
		const matches = at(item, definition.path as unknown as keyof T)
		if (matches.length === 0) {
			this.logger.debug(`did not find match for ${definition.path} in ${JSON.stringify(item)}`)
			return ''
		}
		if (matches.length > 1) {
			this.logger.warn(`found more than one match for ${definition.path} in ${JSON.stringify(item)}`)
		}
		return matches.map(value => stringFromUnknown(value)).join(', ')
	}

	newOutputTable(options?: Partial<TableOptions>): Table {
		const configuredOptions = { groupRows: this.groupRows }

		if (options) {
			return new TableAdapter({ ...configuredOptions, ...options })
		}
		return new TableAdapter(configuredOptions)
	}

	buildTableFromItem<T extends object>(item: T, definitions: TableFieldDefinition<T>[]): string {
		const table = this.newOutputTable()
		for (const definition of definitions) {
			if (typeof definition !== 'object'
					|| definition.include === undefined
					|| definition.include(item)) {
				const value = this.getDisplayValueFor(item, definition)
				if (typeof definition !== 'object'
						|| !definition.skipEmpty
						|| value) {
					table.push([this.getLabelFor(definition), value])
				}
			}
		}
		return table.toString()
	}

	buildTableFromList<T extends object>(items: T[], definitions: TableFieldDefinition<T>[]): string {
		const headingLabels = definitions.map(def => this.getLabelFor(def))
		const table = this.newOutputTable({ isList: true, head: headingLabels })
		for (const item of items) {
			table.push(definitions.map(def => this.getDisplayValueFor(item, def)))
		}
		return table.toString()
	}
}
