import fs from 'fs'
import inquirer from 'inquirer'
import path from 'path'
import yaml from 'js-yaml'
import { flags } from '@oclif/command'

import { APICommand } from './api-command'
import { logManager } from './logger'
import { TableFieldDefinition, TableGenerator } from './table-generator'
import { Loggable } from './smartthings-command'
import { applyMixins } from './util'


// TODO: TEST TEST TEST
// TODO: DOCUMENT DOCUMENT DOCUMENT


const validIndex = /^[1-9][0-9]*$/

// Flags common to both input and output.
const commonIOFlags = {
	indent: flags.integer({
		description: 'specify indentation for formatting JSON or YAML output',
	}),
	json: flags.boolean({
		description: 'use JSON format of input and/or output',
		char: 'j',
	}),
	yaml: flags.boolean({
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
	output: flags.string({
		char: 'o',
		description: 'specify output file',
	}),
	compact: flags.boolean({
		description: 'use compact table format with no lines between body rows',
	}),
	expanded: flags.boolean({
		description: 'use expanded table format with a line between each body row',
	}),

}

export enum IOFormat {
	YAML = 'yaml',
	JSON = 'json',
	// for input, this is Q & A, for output, it's a human-readable table format
	COMMON = 'common',
}

export interface InputOptions {
	// no filename means stdin
	filename?: string
	format: IOFormat
}

export interface OutputOptions {
	// no filename means stdout
	filename?: string
	format: IOFormat
	indentLevel: number
}

export type ListCallback<L> = () => Promise<L[]>
export type GetCallback<ID, O> = (id: ID) => Promise<O>
export type UpdateCallback<ID, I, O> = (id: ID, data: I) => Promise<O>
export type ActionCallback<ID> = (id: ID) => Promise<void>

function formatFromFilename(filename: string): IOFormat {
	const ext = path.extname(filename).toLowerCase()
	if (ext === '.yaml' || ext === '.yml') {
		return IOFormat.YAML
	}
	if (ext === '.json') {
		return IOFormat.JSON
	}
	logManager.getLogger('cli').warn(`could not determine file type from filename "${filename}, assuming YAML`)
	return IOFormat.YAML
}

/**
 * Convert and write the data using the given output options.
 *
 * @param buildTableOutput A function that can convert the data to a table
 *   format if that is what is specified in outputOptions.
 * @param forceTableOutput Including this and setting it to true will force
 *   the output to "table" mode. This is used in "selecting" commands that
 *   need to display a list to the user to choose from.
 */
function writeOutputPrivate<T>(data: T, outputOptions: OutputOptions,
		buildTableOutput?: (data: T) => string, forceTableOutput?: boolean): void {
	let output: string

	if (forceTableOutput && buildTableOutput) {
		output = buildTableOutput(data)
	} else if (outputOptions.format === IOFormat.YAML ) {
		output = yaml.safeDump(data, { indent: outputOptions.indentLevel })
	} else if ((outputOptions.format === IOFormat.JSON) || !buildTableOutput) {
		output = JSON.stringify(data, null, outputOptions.indentLevel)
	} else {
		output = buildTableOutput(data)
	}

	if (outputOptions.filename) {
		fs.writeFileSync(outputOptions.filename, output)
	} else {
		process.stdout.write(output)
		if (!output.endsWith('\n')) {
			process.stdout.write('\n')
		}
	}
}

/* eslint-disable no-process-exit */

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Inputting<I> extends Loggable {}
export abstract class Inputting<I> {
	private _inputOptions?: InputOptions

	protected get inputOptions(): InputOptions {
		if (!this._inputOptions) {
			throw new Error('APICommand not properly initialized')
		}
		return this._inputOptions
	}

	protected getInputFromUser?(): Promise<I>

	protected async readInput(): Promise<I> {
		if (this.inputOptions.format === IOFormat.COMMON && this.getInputFromUser) {
			return this.getInputFromUser()
		}

		return new Promise<I>((resolve, reject) => {
			if (this.inputOptions.format === IOFormat.COMMON) {
				reject('invalid state')
			} else if (this.inputOptions.filename) {
				resolve(yaml.safeLoad(fs.readFileSync(`${this.inputOptions.filename}`, 'utf-8')))
			} else {
				const stdin = process.stdin
				const inputChunks: string[] = []
				stdin.resume()
				stdin.on('data', chunk => {
					inputChunks.push(chunk.toString())
				})
				stdin.on('end', () => {
					try {
						resolve(JSON.parse(inputChunks.join()))
					} catch (err) {
						reject(err)
					}
				})
			}
		})
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async setup(args: { [name: string]: any }, argv: string[], flags: { [name: string]: any }): Promise<void> {
		const hasGetInputFromUser = this.getInputFromUser !== undefined
		let inputFormat: IOFormat
		if (flags.json) {
			inputFormat = IOFormat.JSON
		} else if (flags.yaml) {
			inputFormat = IOFormat.YAML
		} else if (flags.input) {
			inputFormat = formatFromFilename(flags.input)
		} else {
			inputFormat = hasGetInputFromUser && process.stdin.isTTY ? IOFormat.COMMON : IOFormat.YAML
		}

		this._inputOptions = {
			filename: flags.input,
			format: inputFormat,
		}

		if (this._inputOptions.format !== IOFormat.COMMON
				&& !this._inputOptions.filename
				&& process.stdin.isTTY) {
			this.logger.error('input is required either via' +
				' file specified with --input option or from stdin')
			process.exit(1)
		}
	}
}

const inputFlags = {
	...APICommand.flags,
	...commonIOFlags,
	...inputFlag,
}

/**
 * Mixin meant to be used along with Outputting and/or Listing that provides
 * instance of OutputOptions.
 */
abstract class Outputable {
	private _outputOptions?: OutputOptions

	protected get outputOptions(): OutputOptions {
		if (!this._outputOptions) {
			throw new Error('APICommand not properly initialized')
		}
		return this._outputOptions
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async setup(args: { [name: string]: any }, argv: string[], flags: { [name: string]: any }): Promise<void> {
		let inputOptions: InputOptions | undefined = undefined
		if ('inputOptions' in this) {
			// @ts-ignore
			inputOptions = this.inputOptions
		}

		let outputFormat: IOFormat
		if (flags.json) {
			outputFormat = IOFormat.JSON
		} else if (flags.yaml) {
			outputFormat = IOFormat.YAML
		} else if (flags.output) {
			outputFormat = formatFromFilename(flags.output)
		} else {
			outputFormat = inputOptions ? inputOptions.format : IOFormat.COMMON
		}

		const defaultIndentLevel = outputFormat === IOFormat.YAML ? 2 : 4

		this._outputOptions = {
			filename: flags.output,
			format: outputFormat,
			indentLevel: flags.indent || defaultIndentLevel,
		}
	}
}
interface Outputable {
	readonly tableGenerator: TableGenerator
}

const outputFlags = {
	...APICommand.flags,
	...commonIOFlags,
	...outputFlag,
}

const inputOutputFlags = {
	...inputFlags,
	...outputFlag,
}

export abstract class Outputting<O> extends Outputable {
	protected tableFieldDefinitions?: TableFieldDefinition<O>[]

	/**
	 * Build a string for the "table" output format using the given data.
	 *
	 * This method can be overridden if using tableFieldDefinitions does
	 * not suit your needs.
	 */
	protected buildTableOutput(data: O): string {
		if (!this.tableFieldDefinitions) {
			throw new Error('tableFieldDefinitions is required if ' +
				'buildTableOutput is not overridden')
		}
		return this.tableGenerator.buildTableFromItem(data, this.tableFieldDefinitions)
	}

	/**
	 * This method is used to write the output. It will determine the correct
	 * output format and write the output.
	 *
	 * This method is NOT meant to be overridden.
	 */
	protected writeOutput(data: O): void {
		writeOutputPrivate(data, this.outputOptions, this.buildTableOutput.bind(this))
	}
}

export abstract class Listing<L> extends Outputable {
	abstract readonly primaryKeyName: string
	abstract readonly sortKeyName: string

	protected listTableFieldDefinitions?: TableFieldDefinition<L>[]

	protected buildListTableOutput(sortedList: L[]): string {
		const definitions: TableFieldDefinition<L>[] = this.listTableFieldDefinitions ?? [
			this.sortKeyName,
			this.primaryKeyName,
		]
		let count = 0
		definitions.unshift({
			label: '#',
			value: () => (++count).toString(),
		})
		return this.tableGenerator.buildTableFromList(sortedList, definitions)
	}
	protected writeListOutput(data: L[]): void {
		writeOutputPrivate(data, this.outputOptions, this.buildListTableOutput.bind(this))
	}

	protected sort(list: L[]): L[] {
		return list.sort((a, b) => {
			// @ts-ignore
			const av = a[this.sortKeyName].toLowerCase()
			// @ts-ignore
			const bv = b[this.sortKeyName].toLowerCase()
			return av === bv ? 0 : av < bv ? -1 : 1
		})
	}
}

export abstract class InputAPICommand<I> extends APICommand {
	/**
	 * This is just a convenience method that outputs a simple string message
	 * on success and handles exceptions. This is mostly useful for simple
	 * things like a DELETE call that don't have any complicated inputs or
	 * outputs.
	 *
	 * @param executeCommand function that does the work
	 */
	protected processNormally(successMessage: string, executeCommand: (data: I) => Promise<void>): void {
		this.readInput().then(input => {
			return executeCommand(input)
		}).then(() => {
			process.stdout.write(`${successMessage}\n`)
		}).catch(err => {
			this.logger.error(`caught error ${err}`)
			process.exit(1)
		})
	}
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface InputAPICommand<I> extends Inputting<I> {}
applyMixins(InputAPICommand, [Inputting], { mergeFunctions: true })

export abstract class OutputAPICommand<O> extends APICommand {
	/**
	 * This is just a convenience method that outputs the data and handles
	 * exceptions.
	 *
	 * @param executeCommand function that does the work
	 */
	// TODO: maybe add id to match other callbacks (and use GetCallback type)
	protected processNormally(getData: () => Promise<O>): void {
		getData().then(data => {
			this.writeOutput(data)
		}).catch(err => {
			this.logger.error(`caught error ${err}`)
			process.exit(1)
		})
	}

	static flags = outputFlags
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface OutputAPICommand<O> extends Outputting<O> {}
applyMixins(OutputAPICommand, [Outputable, Outputting], { mergeFunctions: true })

/**
 * An API command that has complex input and complex output. This
 * would normally be used for POST and PUT methods.
 *
 * Generic types:
 *   I: the input type
 *   O: the output type
 */
export abstract class InputOutputAPICommand<I, O> extends APICommand {
	/**
	 * This is just a convenience method that reads the input, calls the given
	 * function to act on it and then displays the results to the user.
	 *
	 * @param executeCommand function that does the work
	 */
	// TODO: update signature to use a type from above?
	protected processNormally(executeCommand: (input: I) => Promise<O>): void {
		if (this.flags['dry-run']) {
			this.readInput().then(input => {
				writeOutputPrivate(input, this.outputOptions)
			}).catch(err => {
				this.logger.error(`caught error ${err}`)
				process.exit(1)
			})
		} else {
			this.readInput().then(input => {
				return executeCommand(input)
			}).then(saved => {
				this.writeOutput(saved)
			}).catch(err => {
				this.logger.error(`caught error ${err}`)
				process.exit(1)
			})
		}
	}

	static flags = {
		...inputOutputFlags,
		'dry-run': flags.boolean({
			char: 'd',
			description: "produce JSON but don't actually submit",
		}),
	}
}

export interface InputOutputAPICommand<I, O> extends Inputting<I>, Outputting<O> {}
applyMixins(InputOutputAPICommand, [Inputting, Outputable, Outputting], { mergeFunctions: true })


export abstract class ListingOutputAPICommandBase<ID, O, L> extends APICommand {
	protected abstract async translateToId(idOrIndex: ID | string,
		listFunction: ListCallback<L>): Promise<ID>

	protected async processNormally(idOrIndex: ID | string | undefined,
			listFunction: ListCallback<L>,
			getFunction: GetCallback<ID, O>): Promise<void> {
		try {
			if (idOrIndex) {
				const id: ID = await this.translateToId(idOrIndex, listFunction)
				const item = await getFunction(id)
				this.writeOutput(item)
			} else {
				const list = this.sort(await listFunction())
				writeOutputPrivate(list, this.outputOptions, this.buildListTableOutput.bind(this))
			}
		} catch (err) {
			this.logger.error(`caught error ${err}`)
			process.exit(1)
		}
	}

	static flags = outputFlags
}
export interface ListingOutputAPICommandBase<ID, O, L> extends Outputting<O>, Listing<L> {}
applyMixins(ListingOutputAPICommandBase, [Outputable, Outputting, Listing], { mergeFunctions: true })

export abstract class ListingOutputAPICommand<O, L> extends ListingOutputAPICommandBase<string, O, L> {
	protected translateToId = stringTranslateToId
	static flags = ListingOutputAPICommandBase.flags
}

/**
 * This class acts on an id via an "action callback" when one is specified.
 *
 * If none is specified, it will query a list of items using the "list callback",
 * display that list to the user and allow them to choose one by id or index.
 *
 * Generic types:
 *   ID: the type of the id; usually string
 *   L: the type of each object returned by the list callback
 *
 * NOTE: most APIs use a simple string for the input type and can use
 * SelectingAPICommand instead.
 */
export abstract class SelectingAPICommandBase<ID, L> extends APICommand {
	protected abstract async getIdFromUser(items: L[]): Promise<ID>

	protected async processNormally(id: ID | undefined,
			listCallback: ListCallback<L>,
			actionCallback: ActionCallback<ID>,
			successMessage: string): Promise<void> {
		try {
			let inputId
			if (id) {
				if (typeof id !== 'string' || !id.match(validIndex)) {
					inputId = id
				} else {
					throw new Error('List index references not supported for this command. Specify id instead or omit argument and select from list')
				}
			} else {
				const items = this.sort(await listCallback())
				if (items.length === 0) {
					this.log('no items found')
					process.exit(0)
				}
				this.writeListOutput(items)
				inputId = await this.getIdFromUser(items)
			}
			await actionCallback(inputId)
			this.log(successMessage.replace('{{id}}', JSON.stringify(inputId)))
		} catch (err) {
			this.logger.error(`caught error ${err}`)
			process.exit(1)
		}
	}

	static flags = APICommand.flags
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SelectingAPICommandBase<ID, L> extends Outputable, Listing<L> {}
applyMixins(SelectingAPICommandBase, [Outputable, Listing], { mergeFunctions: true })

async function stringTranslateToId<L>(this: APICommand & { readonly primaryKeyName: string; sort(list: L[]): L[] },
		idOrIndex: string,
		listFunction: ListCallback<L>): Promise<string> {

	if (!idOrIndex.match(validIndex)) {
		// idOrIndex isn't a valid index so has to be an id (or bad)
		return idOrIndex
	}

	const index = Number.parseInt(idOrIndex)

	const items = this.sort(await listFunction())
	const matchingItem: L = items[index - 1]
	if (!(this.primaryKeyName in matchingItem)) {
		throw Error(`did not find key ${this.primaryKeyName} in data`)
	}
	// @ts-ignore
	const pk = matchingItem[this.primaryKeyName]
	if (typeof pk === 'string') {
		return pk
	}

	throw Error(`invalid type ${typeof pk} for primary key`  +
		` ${this.primaryKeyName} in ${JSON.stringify(matchingItem)}`)
}

async function stringGetIdFromUser<L>(this: APICommand & { readonly primaryKeyName: string }, items: L[]): Promise<string> {
	const convertToId = (itemIdOrIndex: string): string | false => {
		if (itemIdOrIndex.length === 0) {
			return false
		}
		const matchingItem = items.find((item) => {
			// @ts-ignore
			return (this.primaryKeyName in item) && itemIdOrIndex === item[this.primaryKeyName]
		})
		if (matchingItem) {
			return itemIdOrIndex
		}

		if (!itemIdOrIndex.match(validIndex)) {
			return false
		}

		const index = Number.parseInt(itemIdOrIndex)

		if (!Number.isNaN(index) && index > 0 && index <= items.length) {
			// @ts-ignore
			const pk = items[index - 1][this.primaryKeyName]
			if (typeof pk === 'string') {
				return pk
			} else {
				throw Error(`invalid type ${typeof pk} for primary key`  +
					` ${this.primaryKeyName} in ${JSON.stringify(items[index - 1])}`)
			}
		} else {
			return false
		}
	}
	const itemIdOrIndex: string = (await inquirer.prompt({
		type: 'input',
		name: 'itemIdOrIndex',
		message: 'Enter id or index',
		validate: (input) => {
			return convertToId(input)
				? true
				: `Invalid id or index ${itemIdOrIndex}. Please enter an index or valid id.`
		},
	})).itemIdOrIndex
	const inputId = convertToId(itemIdOrIndex)
	if (inputId === false) {
		throw Error(`unable to convert ${itemIdOrIndex} to id`)
	}
	return inputId
}

/**
 * A version of SelectingAPICommandBase for APIs that use strings for
 * their id, which is nearly all of them.
 */
export abstract class SelectingAPICommand<L> extends SelectingAPICommandBase<string, L> {
	protected getIdFromUser = stringGetIdFromUser
}

export abstract class SelectingInputOutputAPICommandBase<ID, I, O, L> extends APICommand {
	protected abstract async getIdFromUser(items: L[]): Promise<ID>

	protected async processNormally(id: ID | undefined,
			listCallback: ListCallback<L>,
			updateCallback: UpdateCallback<ID, I, O>): Promise<void> {
		try {
			let inputId: ID
			if (id) {
				this.log(`using id from command line = ${id}`)
				inputId = id
			} else if (this.inputOptions.filename || process.stdin.isTTY) {
				const items = this.sort(await listCallback())
				if (items.length === 0) {
					this.log('no items found')
					process.exit(0)
				}
				writeOutputPrivate(items, this.outputOptions, this.buildListTableOutput.bind(this), true)
				inputId = await this.getIdFromUser(items)
			} else {
				throw Error('When input data comes in via stdin, id is required on command line')
			}
			const input: I = await this.readInput()
			const output = await updateCallback(inputId, input)
			this.writeOutput(output)
		} catch (err) {
			this.logger.error(`caught error ${err}`)
			process.exit(1)
		}
	}

	static flags = inputOutputFlags
}
export interface SelectingInputOutputAPICommandBase<ID, I, O, L> extends Inputting<I>, Outputting<O>, Listing<L> {}
applyMixins(SelectingInputOutputAPICommandBase, [Inputting, Outputable, Outputting, Listing], { mergeFunctions: true })

export abstract class SelectingInputOutputAPICommand<I, O, L> extends SelectingInputOutputAPICommandBase<string, I, O, L> {
	protected getIdFromUser = stringGetIdFromUser
}

export abstract class SelectingOutputAPICommandBase<ID, O, L> extends APICommand {
	protected abstract async getIdFromUser(items: L[]): Promise<ID>

	protected abstract async translateToId(idOrIndex: ID | string,
		listFunction: ListCallback<L>): Promise<ID>

	protected acceptIndexId = false

	protected async processNormally(idOrIndex: ID | string | undefined,
			listCallback: ListCallback<L>,
			actionCallback: GetCallback<ID, O>): Promise<void> {
		try {
			let inputId: ID
			if (idOrIndex) {
				if (this.acceptIndexId || typeof idOrIndex !== 'string' || !idOrIndex.match(validIndex)) {
					inputId = await this.translateToId(idOrIndex, listCallback)
				} else {
					throw new Error('List index references not supported for this command. Specify id instead or omit argument and select from list')
				}
			} else {
				const items = this.sort(await listCallback())
				if (items.length === 0) {
					this.log('no items found')
					process.exit(0)
				}
				writeOutputPrivate(items, this.outputOptions, this.buildListTableOutput.bind(this), true)
				inputId = await this.getIdFromUser(items)
			}
			const output = await actionCallback(inputId)
			this.writeOutput(output)
		} catch (err) {
			this.logger.error(`caught error ${err}`)
			process.exit(1)
		}
	}

	static flags = outputFlags
}
export interface SelectingOutputAPICommandBase<ID, O, L> extends Outputting<O>, Listing<L> {}
applyMixins(SelectingOutputAPICommandBase, [Outputable, Outputting, Listing], { mergeFunctions: true })

export abstract class SelectingOutputAPICommand<O, L> extends SelectingOutputAPICommandBase<string, O, L> {
	protected getIdFromUser = stringGetIdFromUser
	protected translateToId = stringTranslateToId
}
/* eslint-enable no-process-exit */
