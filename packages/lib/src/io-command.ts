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
	 * This is just a convenience method that outputs thee data and handles
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
