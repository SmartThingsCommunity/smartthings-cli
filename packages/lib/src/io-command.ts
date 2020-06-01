import fs from 'fs'
import inquirer from 'inquirer'
import path from 'path'
import yaml from 'js-yaml'
import { flags } from '@oclif/command'

import { APICommand } from './api-command'
import { logManager } from './logger'


// TODO: TEST TEST TEST
// TODO: DOCUMENT DOCUMENT DOCUMENT

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

// TODO: make generic type names match ones we've used below
export type ListCallback<T> = () => Promise<T[]>
export type GetCallback<T> = (id: string) => Promise<T>
export type UpdateCallback<T, U> = (id: string, data: U) => Promise<T>
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function determineOutputOptions(flags: { [name: string]: any }, inputOptions?: InputOptions): OutputOptions {
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
	return {
		filename: flags.output,
		format: outputFormat,
		indentLevel: flags.indent || defaultIndentLevel,
	}
}

function writeOutput<T>(data: T, outputOptions: OutputOptions, buildTableOutput: (data: T) => string): void {
	let output: string

	if (outputOptions.format === IOFormat.JSON) {
		output = JSON.stringify(data, null, outputOptions.indentLevel)
	} else if (outputOptions.format === IOFormat.YAML) {
		output = yaml.safeDump(data, { indent: outputOptions.indentLevel })
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

/**
 * An API command that defines only output. Useful for REST calls that return
 * data but don't take complex data like GET calls that return a single object.
 */
export abstract class BaseOutputAPICommand<O> extends APICommand {
	private _outputOptions?: OutputOptions

	protected get outputOptions(): OutputOptions {
		if (!this._outputOptions) {
			throw new Error('APICommand not properly initialized')
		}
		return this._outputOptions
	}

	protected abstract buildTableOutput(data: O): string

	protected writeOutput(data: O): void {
		writeOutput(data, this.outputOptions, this.buildTableOutput.bind(this))
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected async setup(args: { [name: string]: any }, argv: string[], flags: { [name: string]: any }): Promise<void> {
		await super.setup(args, argv, flags)

		this._outputOptions = determineOutputOptions(this.flags)
	}

	static flags = {
		...APICommand.flags,
		...commonIOFlags,
		...outputFlag,
	}
}

/* eslint-disable no-process-exit */

export abstract class OutputAPICommand<O> extends BaseOutputAPICommand<O> {
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

	static flags = BaseOutputAPICommand.flags
}

/**
 * An API command that has complex input and complex output. This
 * would normally be used for POST and PUT methods.
 *
 * Generic types:
 *   I: the input type
 *   O: the output type
 */
export abstract class InputOutputAPICommand<I, O> extends OutputAPICommand<O> {
	protected getInputFromUser?(): Promise<I>

	private _inputOptions?: InputOptions

	protected get inputOptions(): InputOptions {
		if (!this._inputOptions) {
			throw new Error('APICommand not properly initialized')
		}
		return this._inputOptions
	}

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
				this.log(JSON.stringify(input, null, 4))
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

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected async setup(args: { [name: string]: any }, argv: string[], flags: { [name: string]: any }): Promise<void> {
		await super.setup(args, argv, flags)

		let inputFormat: IOFormat
		if (this.flags.json) {
			inputFormat = IOFormat.JSON
		} else if (this.flags.yaml) {
			inputFormat = IOFormat.YAML
		} else if (this.flags.input) {
			inputFormat = formatFromFilename(this.flags.input)
		} else {
			inputFormat = this.getInputFromUser && process.stdin.isTTY ? IOFormat.COMMON : IOFormat.YAML
		}

		this._inputOptions = {
			filename: this.flags.input,
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

	static flags = {
		...OutputAPICommand.flags,
		...inputFlag,
		'dry-run': flags.boolean({
			char: 'd',
			description: "produce JSON but don't actually submit",
		}),
	}
}

/**
 * Base class for classes that need to be able to output a numbered list of
 * something.
 */
export abstract class ListingCommand<L> extends BaseOutputAPICommand<L[]> {
	protected abstract primaryKeyName: string
	protected abstract sortKeyName: string

	// TODO: replace tableHeadings with tableFieldDefinitions
	// protected abstract tableFieldDefinitions: TableFieldDefinition<T>[]
	protected tableHeadings(): string[] {
		return [this.sortKeyName, this.primaryKeyName]
	}

	protected buildTableOutput(sortedList: L[]): string {
		const head = this.tableHeadings()
		let count = 1
		const table = this.newOutputTable({ head: ['#', ...head] })
		for (const obj of sortedList) {
			const item = [count++, ...head.map(name => {
				// @ts-ignore
				return obj[name]
			})]
			table.push(item)
		}
		return table.toString()
	}

	protected sort(list: L[]): L[] {
		const sortKey = this.tableHeadings()[0]
		return list.sort((a, b) => {
			// @ts-ignore
			const av = a[sortKey]
			// @ts-ignore
			const bv = b[sortKey]
			return av === bv ? 0 : av < bv ? -1 : 1
		})
	}

	static flags = OutputAPICommand.flags
}

// TODO: should I put L before O again? (and use I, L, O for input output)
export abstract class ListingOutputAPICommand<O, L> extends ListingCommand<L> {
	protected abstract buildObjectTableOutput(data: O): string

	protected async processNormally(idOrIndex: string | undefined, listFunction: ListCallback<L>, getFunction: GetCallback<O>): Promise<void> {
		try {
			if (idOrIndex) {
				let id: string
				if (typeof (idOrIndex) === 'number' || !isNaN(Number(idOrIndex))) {
					const index = typeof (idOrIndex) === 'string' ? Number.parseInt(idOrIndex) : idOrIndex
					const items = this.sort(await listFunction())
					const searchItem: L = items[index - 1]
					if (!(this.primaryKeyName in searchItem)) {
						throw Error(`did not find key ${this.primaryKeyName} in data`)
					}
					// @ts-ignore
					const pk = searchItem[this.primaryKeyName]
					if (typeof pk === 'string') {
						id = pk
					} else {
						throw Error(`invalid type ${typeof pk} for primary key`  +
							` ${this.primaryKeyName} in ${JSON.stringify(searchItem)}`)
					}
				} else {
					id = idOrIndex
				}
				const item = await getFunction(id)
				writeOutput(item, this.outputOptions, this.buildObjectTableOutput.bind(this))
			} else {
				const list = this.sort(await listFunction())
				writeOutput(list, this.outputOptions, this.buildTableOutput.bind(this))
			}
		} catch (err) {
			this.logger.error(`caught error ${err}`)
			process.exit(1)
		}
	}
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
 * StringSelectingInputAPICommand instead.
 */
export abstract class SelectingInputAPICommand<ID, L> extends ListingCommand<L> {
	protected abstract async getIdFromUser(items: L[]): Promise<ID>

	protected async processNormally(id: ID | undefined,
			listCallback: ListCallback<L>,
			actionCallback: ActionCallback<ID>,
			successMessage: string): Promise<void> {
		try {
			let inputId
			if (id) {
				inputId = id
			} else {
				const items = this.sort(await listCallback())
				writeOutput(items, this.outputOptions, this.buildTableOutput.bind(this))
				inputId = await this.getIdFromUser(items)
			}
			await actionCallback(inputId)
			this.log(successMessage.replace('{{id}}', JSON.stringify(inputId)))
		} catch (err) {
			this.logger.error(`caught error ${err}`)
			process.exit(1)
		}
	}
}

/**
 * A version of SelectingInputAPICommand for APIs that use strings for their id.
 */
export abstract class StringSelectingInputAPICommand<L> extends SelectingInputAPICommand<string, L> {
	protected async getIdFromUser(items: L[]): Promise<string> {
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
}

/* eslint-enable no-process-exit */
