import fs from 'fs'
import yaml from 'js-yaml'
import { flags } from '@oclif/command'
import path from 'path'

import { APICommand } from './api-command'
import { logManager } from './logger'
import Table from 'cli-table'


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
	yaml : flags.boolean({
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
	output : flags.string({
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

export type ListCallback<T> = () => Promise<T[]>;
export type GetCallback<T> = (id: string) => Promise<T>;
export type UpdateCallback<T,U> = (id: string, data: U) => Promise<T>;

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

export abstract class InputAPICommand<T> extends APICommand {
	protected getInputFromUser?(): Promise<T>

	private _inputOptions?: InputOptions

	protected get inputOptions(): InputOptions {
		if (!this._inputOptions) {
			throw new Error('APICommand not properly initialized')
		}
		return this._inputOptions
	}

	protected async readInput(): Promise<T> {
		if (this.inputOptions.format === IOFormat.COMMON && this.getInputFromUser) {
			return this.getInputFromUser()
		}

		return new Promise<T>((resolve, reject) => {
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

function writeOutput<T>(data: T, outputOptions: OutputOptions, buildTableOutput?: (data: T) => string): void {
	let output: string

	if (outputOptions.format === IOFormat.JSON) {
		output = JSON.stringify(data, null, outputOptions.indentLevel)
	} else if (outputOptions.format === IOFormat.YAML) {
		output = yaml.safeDump(data, { indent: outputOptions.indentLevel })
	} else if (buildTableOutput) {
		output = buildTableOutput(data)
	} else {
		output = JSON.stringify(data, null, outputOptions.indentLevel)
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

export abstract class OutputAPICommand<T> extends APICommand {
	private _outputOptions?: OutputOptions

	protected get outputOptions(): OutputOptions {
		if (!this._outputOptions) {
			throw new Error('APICommand not properly initialized')
		}
		return this._outputOptions
	}

	protected abstract buildTableOutput(data: T): string

	protected writeOutput(data: T): void {
		writeOutput(data, this.outputOptions, this.buildTableOutput.bind(this))
	}

	/**
	 * This is just a convenience method that outputs the data and handles
	 * exceptions.
	 *
	 * @param executeCommand function that does the work
	 */
	protected processNormally(getData: () => Promise<T>): void {
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

export abstract class InputOutputAPICommand<T, U> extends InputAPICommand<T> {
	// Since we can only extend InputAPICommand or OutputAPICommand, we have
	// add stuff from the other.
	private _outputOptions?: OutputOptions

	protected get outputOptions(): OutputOptions {
		if (!this._outputOptions) {
			throw new Error('APICommand not properly initialized')
		}
		return this._outputOptions
	}

	protected abstract buildTableOutput(data: U): string

	protected writeOutput(data: U): void {
		writeOutput(data, this.outputOptions, this.buildTableOutput.bind(this))
	}

	/**
	 * This is just a convenience method that reads the input, calls the given
	 * function to act on it and then displays the results to the user.
	 *
	 * @param executeCommand function that does the work
	 */
	protected processNormally(executeCommand: (input: T) => Promise<U>): void {
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
		'dry-run' : flags.boolean({
			char: 'd',
			description: "produce JSON but don't actually submit",
		}),
	}
}

export abstract class ListableCommand<L, T> extends APICommand {
	protected abstract primaryKeyName(): string
	protected abstract sortKeyName(): string
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

	protected buildObjectTableOutput(data: T): string {
		return JSON.stringify(data, null, this.outputOptions.indentLevel)
	}

	protected buildTableOutput(sortedList: L[]): string {
		const head = this.tableHeadings()
		let count = 1
		const table = this.newOutputTable({ head: ['#', ...head]})
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

export abstract class ListableObjectOutputCommand<L, T> extends ListableCommand<L,T> {
	protected async processNormally(id: any, listFunction: ListCallback<L>, getFunction: GetCallback<T>): Promise<void> {
		try {
			if (id) {
				let item: T
				if (!isNaN(id)) {
					const index = parseInt(id)
					const items = this.sort( await listFunction())
					// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
					// @ts-ignore
					item = await getFunction(items[index - 1][this.primaryKeyName()])
				} else {
					item = await getFunction(id)
				}
				writeOutput<T>(item, this.outputOptions, this.buildObjectTableOutput.bind(this))
			} else {
				const list = this.sort(await listFunction())
				writeOutput<L[]>(list, this.outputOptions, this.buildTableOutput.bind(this))
			}
		} catch(err) {
			this.logger.error(`caught error ${err}`)
			this.exit(1)
		}
	}
}

export abstract class ListableObjectInputOutputCommand<L, T, U> extends ListableCommand<L, T> {
	protected getInputFromUser?(): Promise<U>

	private _inputOptions?: InputOptions

	protected get inputOptions(): InputOptions {
		if (!this._inputOptions) {
			throw new Error('APICommand not properly initialized')
		}
		return this._inputOptions
	}

	protected async processNormally(id: any, listFunction: ListCallback<L>, updateFunction: UpdateCallback<T,U>): Promise<void> {
		try {
			const data: U = await this.readInput()
			let item: T
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
			writeOutput<T>(item, this.outputOptions, this.buildObjectTableOutput.bind(this))
		} catch(err) {
			this.logger.error(`caught error ${err}`)
			this.exit(1)
		}
	}

	protected async readInput(): Promise<U> {
		if (this.inputOptions.format === IOFormat.COMMON && this.getInputFromUser) {
			return this.getInputFromUser()
		}

		return new Promise<U>((resolve, reject) => {
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
