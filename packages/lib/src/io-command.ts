import fs from 'fs'
import yaml from 'js-yaml'
import { flags } from '@oclif/command'
import path from 'path'

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

export type ListCallback<T> = () => Promise<T[]>
export type GetCallback<T> = (id: string) => Promise<T>
export type UpdateCallback<T, U> = (id: string, data: U) => Promise<T>

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

export abstract class InputAPICommand<I> extends APICommand {
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
					resolve(JSON.parse(inputChunks.join()))
				})
			}
		})
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
			logManager.getLogger('cli').error('input is required either via' +
				' file specified with --input option or from stdin')
			this.exit(1)
		}
	}

	static flags = {
		...APICommand.flags,
		...commonIOFlags,
		...inputFlag,
	}
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
 * An API command that defines only output. This is primarily useful for
 * GET calls that return a single object.
 */
export abstract class OutputAPICommand<O> extends APICommand {
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

	/**
	 * This is just a convenience method that outputs the data and handles
	 * exceptions.
	 *
	 * @param executeCommand function that does the work
	 */
	protected processNormally(getData: () => Promise<O>): void {
		getData().then(data => {
			this.writeOutput(data)
		}).catch(err => {
			this.logger.error(`caught error ${err}`)
			this.exit(1)
		})
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

/**
 * An API command that has complicated input and complicated output. This
 * would normally be used for POST and PUT methods.
 *
 * Generic types:
 *   I: the input type
 *   O: the output type
 */
export abstract class InputOutputAPICommand<I, O> extends InputAPICommand<I> {
	// Since we can only extend InputAPICommand or OutputAPICommand, we have
	// add stuff from the other.
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

	/**
	 * This is just a convenience method that reads the input, calls the given
	 * function to act on it and then displays the results to the user.
	 *
	 * @param executeCommand function that does the work
	 */
	protected processNormally(executeCommand: (input: I) => Promise<O>): void {
		if (this.flags['dry-run']) {
			this.readInput().then(input => {
				this.log(JSON.stringify(input, null, 4))
			}).catch(err => {
				this.logger.error(`caught error ${err}`)
			})
		} else {
			this.readInput().then(input => {
				return executeCommand(input)
			}).then(saved => {
				this.writeOutput(saved)
			}).catch(err => {
				this.logger.error(`caught error ${err}`)
				this.exit(1)
			})
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected async setup(args: { [name: string]: any }, argv: string[], flags: { [name: string]: any }): Promise<void> {
		await super.setup(args, argv, flags)

		this._outputOptions = determineOutputOptions(this.flags, this.inputOptions)
	}

	static flags = {
		...InputAPICommand.flags,
		...outputFlag,
		'dry-run': flags.boolean({
			char: 'd',
			description: "produce JSON but don't actually submit",
		}),
	}
}

export abstract class ListableCommand<O, L> extends APICommand {
	protected abstract primaryKeyName(): string
	protected abstract sortKeyName(): string
	// TODO: replace tableHeadings with tableFieldDefinitions
	// protected abstract tableFieldDefinitions: TableFieldDefinition<T>[]
	protected tableHeadings(): string[] {
		return [this.sortKeyName(), this.primaryKeyName()]
	}

	private _outputOptions?: OutputOptions
	protected get outputOptions(): OutputOptions {
		if (!this._outputOptions) {
			throw new Error('APICommand not properly initialized')
		}
		return this._outputOptions
	}

	protected abstract buildObjectTableOutput(data: O): string

	protected buildTableOutput(sortedList: L[]): string {
		const head = this.tableHeadings()
		let count = 1
		const table = this.newOutputTable({ head: ['#', ...head] })
		for (const obj of sortedList) {
			const item = [count++, ...head.map(name => {
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
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
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			const av = a[sortKey]
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			const bv = b[sortKey]
			return av === bv ? 0 : av < bv ? -1 : 1
		})
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

// TODO: look more into the generics here and see if we can be more explicit
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class ListableObjectOutputCommand<O, L extends { [name: string]: any }> extends ListableCommand<O, L> {
	protected async processNormally(idOrIndex: string | number, listFunction: ListCallback<L>, getFunction: GetCallback<O>): Promise<void> {
		try {
			if (idOrIndex) {
				let id: string
				if (typeof (idOrIndex) === 'number' || !isNaN(Number(idOrIndex))) {
					const index = typeof (idOrIndex) === 'string' ? Number.parseInt(idOrIndex) : idOrIndex
					const items = this.sort(await listFunction())
					const searchItem: L = items[index - 1]
					if (!(this.primaryKeyName() in searchItem)) {
						throw Error(`did not find key ${this.primaryKeyName()} in data`)
					}
					id = searchItem[this.primaryKeyName()]
				} else {
					id = idOrIndex
				}
				const item = await getFunction(id)
				writeOutput<O>(item, this.outputOptions, this.buildObjectTableOutput.bind(this))
			} else {
				const list = this.sort(await listFunction())
				writeOutput<L[]>(list, this.outputOptions, this.buildTableOutput.bind(this))
			}
		} catch (err) {
			this.logger.error(`caught error ${err}`)
			this.exit(1)
		}
	}
}

// TODO: add "API" and standardize generic names
export abstract class ListableObjectInputOutputCommand<I, O, L> extends ListableCommand<O, L> {
	protected getInputFromUser?(): Promise<I>

	private _inputOptions?: InputOptions

	protected get inputOptions(): InputOptions {
		if (!this._inputOptions) {
			throw new Error('APICommand not properly initialized')
		}
		return this._inputOptions
	}

	// TODO: I feel like id doesn't have to be any; maybe `string | number` or even just `string`
	// since even when it's a number, it comes in as a string
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected async processNormally(id: any, listFunction: ListCallback<L>, updateFunction: UpdateCallback<O, I>): Promise<void> {
		try {
			const data: I = await this.readInput()
			let item: O
			if (!isNaN(id)) {
				const index = parseInt(id)
				let items = await listFunction()
				items = this.sort(items)
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				item = await updateFunction(items[index - 1][this.primaryKeyName()], data)
			} else {
				item = await updateFunction(id, data)
			}
			writeOutput<O>(item, this.outputOptions, this.buildObjectTableOutput.bind(this))
		} catch (err) {
			this.logger.error(`caught error ${err}`)
			this.exit(1)
		}
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
					resolve(JSON.parse(inputChunks.join()))
				})
			}
		})
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
			logManager.getLogger('cli').error('input is required either via' +
				' file specified with --input option or from stdin')
			this.exit(1)
		}
	}

	static flags = {
		...APICommand.flags,
		...commonIOFlags,
		...inputFlag,
		...outputFlag,
	}
}
