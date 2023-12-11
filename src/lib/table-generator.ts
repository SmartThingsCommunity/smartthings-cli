import at from 'lodash.at'
import log4js from 'log4js'
import { table } from 'table'

import { stringFromUnknown } from './util.js'


type TableFieldDefinitionBase<T extends object> = {
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
export type PropertyTableFieldDefinition<T extends object> = TableFieldDefinitionBase<T> & {
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
export type PathTableFieldDefinition<T extends object> = TableFieldDefinitionBase<T> & {
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
export type ValueTableFieldDefinition<T extends object> = TableFieldDefinitionBase<T> & {
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

export type TableGenerator = {
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

export type TableOptions = {
	/**
	 * Separate groups of four rows by a line to make long rows easier to follow across the screen.
	 */
	groupRows: boolean
	head: string[]
	isList?: boolean
}

export type TableCellData = string | number | boolean | undefined
export type Table = {
	push: (row: TableCellData[]) => void

	toString: () => string
}

const setupTable = (options: Partial<TableOptions>): Table => {
	const data: string[][] = []

	const push = (row: TableCellData[]): number => data.push(row.map(cell => cell?.toString() ?? ''))

	if (options.head) {
		data.push(options.head)
	}

	const toString = (): string => {
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

		const listDrawHorizontalLine = options.groupRows
			? (index: number) => index === 0 || index === data.length || (index - 1) % 5 === 0
			: (index: number) => index === 0 || index === data.length || index === 1
		const drawHorizontalLine = options.isList
			? listDrawHorizontalLine
			: (index: number) => index === 0 || index === data.length
		const config = { drawHorizontalLine, border }
		return table(data, config)
	}

	return { push, toString }
}

export const defaultTableGenerator = (tableOptions: Pick<TableOptions, 'groupRows'>): TableGenerator => {
	const logger = log4js.getLogger('table-manager')

	const convertToLabel = (propertyName: string): string => {
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

	const getLabelFor = <T extends object>(definition: TableFieldDefinition<T>): string => {
		if (typeof definition !== 'object') {
			return convertToLabel(definition.toString())
		}

		if (definition.label) {
			return definition.label
		}

		if ('value' in definition) {
			return definition.label
		}

		if ('prop' in definition) {
			return convertToLabel(definition.prop.toString())
		}

		return convertToLabel(definition.path)
	}

	const getDisplayValueFor = <T extends object>(item: T, definition: TableFieldDefinition<T>): string | undefined => {
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
			logger.debug(`did not find match for ${definition.path} in ${JSON.stringify(item)}`)
			return ''
		}
		if (matches.length > 1) {
			logger.warn(`found more than one match for ${definition.path} in ${JSON.stringify(item)}`)
		}
		return matches.map(value => stringFromUnknown(value)).join(', ')
	}

	const newOutputTable = (options?: Partial<TableOptions>): Table => {
		const configuredOptions = { ...tableOptions }

		if (options) {
			return setupTable({ ...configuredOptions, ...options })
		}
		return setupTable(configuredOptions)
	}

	const buildTableFromItem = <T extends object>(item: T, definitions: TableFieldDefinition<T>[]): string => {
		const table = newOutputTable()
		for (const definition of definitions) {
			if (typeof definition !== 'object'
					|| definition.include === undefined
					|| definition.include(item)) {
				const value = getDisplayValueFor(item, definition)
				if (typeof definition !== 'object'
						|| !definition.skipEmpty
						|| value) {
					table.push([getLabelFor(definition), value])
				}
			}
		}
		return table.toString()
	}

	const buildTableFromList = <T extends object>(items: T[], definitions: TableFieldDefinition<T>[]): string => {
		const headingLabels = definitions.map(def => getLabelFor(def))
		const table = newOutputTable({ isList: true, head: headingLabels })
		for (const item of items) {
			table.push(definitions.map(def => getDisplayValueFor(item, def)))
		}
		return table.toString()
	}

	return { newOutputTable, buildTableFromItem, buildTableFromList }
}
