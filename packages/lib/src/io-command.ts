/* eslint-disable @typescript-eslint/ban-ts-comment */
import fs from 'fs'
import yaml from 'js-yaml'
import { flags } from '@oclif/command'

import { APICommand } from './api-command'
import { commonIOFlags, inputFlag } from './input'
import { formatFromFilename, IOFormat } from './io-util'
import { outputFlags as outputFlag } from './output-builder'
import { Loggable } from './smartthings-command'
import { TableFieldDefinition, TableGenerator } from './table-generator'
import { applyMixins } from './util'


interface InputOptions {
	// no filename means stdin
	filename?: string
	format: IOFormat
}

interface OutputOptions {
	// no filename means stdout
	filename?: string
	format: IOFormat
	indentLevel: number
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

// eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-unused-vars
export interface Inputting<I> extends Loggable {}
/**
 * The "Inputting" mixin is used to add the ability of accepting complex
 * input in the form of JSON or YAML (from stdin or a file) to a command.
 *
 * Additionally, this input can be built via command line if
 * hasCommandLineInput and getInputFromCommandLine are implemented.
 * Likewise, implementing getInputFromUser allows a command to also build
 * input from a Q and A session with the user.
 */
export abstract class Inputting<I> {
	private _inputOptions?: InputOptions

	protected get inputOptions(): InputOptions {
		if (!this._inputOptions) {
			throw new Error('APICommand not properly initialized')
		}
		return this._inputOptions
	}

	/**
	 * Implement this method if you want to build input from command line
	 * options. If this method is implemented, one must also implement
	 * hasCommandLineInput.
	 */
	protected getInputFromCommandLine?(): Promise<I>

	/**
	 * Implement this if and only if getInputFromCommandLine has been
	 * implemented. This should return true if command line arguments are
	 * present that can be used to construct the input.
	 */
	protected hasCommandLineInput?(): boolean

	/**
	 * Implement this method if you want to be able to ask the user for input,
	 * usually in a question and answer format using inquirer.
	 */
	protected getInputFromUser?(): Promise<I>

	protected async readInput(): Promise<I> {
		if (this.hasCommandLineInput && this.hasCommandLineInput()) {
			if (this.getInputFromCommandLine) {
				return this.getInputFromCommandLine()
			} else {
				throw new Error('input is required either via' +
					' file specified with --input option or from stdin')
			}
		}

		if (this.inputOptions.format === IOFormat.COMMON && this.getInputFromUser) {
			return this.getInputFromUser()
		}

		return new Promise<I>((resolve, reject) => {
			if (this.inputOptions.format === IOFormat.COMMON) {
				reject('invalid state')
			} else {
				const finish = (rawInputData: string, filename: string): void => {
					const data = yaml.safeLoad(rawInputData)
					if (!data) {
						reject(`did not get any data from ${filename}`)
					} else if (typeof data === 'string') {
						reject(`got simple string from ${filename}`)
					} else {
						// @ts-ignore
						resolve(data)
					}
				}
				if (this.inputOptions.filename) {
					finish(fs.readFileSync(`${this.inputOptions.filename}`, 'utf-8'), this.inputOptions.filename)
				} else {
					const stdin = process.stdin
					const inputChunks: string[] = []
					stdin.resume()
					stdin.on('data', chunk => {
						inputChunks.push(chunk.toString())
					})
					stdin.on('end', () => {
						finish(inputChunks.join(''), 'stdin')
					})
				}
			}
		})
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async setup(args: { [name: string]: any }, argv: string[], flags: { [name: string]: any }): Promise<void> {
		if (this.hasCommandLineInput !== undefined && this.getInputFromCommandLine === undefined
				|| this.hasCommandLineInput === undefined && this.getInputFromCommandLine !== undefined) {
			throw new Error('invalid code; implement both hasCommandLineInput and getInputFromCommandLine or neither')
		}
		let inputFormat: IOFormat
		if (flags.json) {
			inputFormat = IOFormat.JSON
		} else if (flags.yaml) {
			inputFormat = IOFormat.YAML
		} else if (flags.input) {
			inputFormat = formatFromFilename(flags.input)
		} else if (this.getInputFromUser !== undefined && process.stdin.isTTY
				|| this.hasCommandLineInput && this.hasCommandLineInput()) {
			inputFormat = IOFormat.COMMON
		} else {
			inputFormat = IOFormat.YAML
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
 * @deprecated use functions from io modules instead
 *
 * Since both Outputting and Listing need OutputOptions, this is a simple
 * mixin that adds it and needs to be included when one or both of those
 * mixins are used.
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

const inputOutputFlags = {
	...inputFlags,
	...outputFlag,
}

/**
 * The "Outputting" mixin is used to add the ability of presenting complex
 * output in the form of JSON, YAML or a more human-readable format.
 * JSON and YAML output are built-in and require no extra implementation but
 * for the more human-readable output (which is the default), one must
 * define the tableFieldDefinitions property or override the buildTableOutput
 * method. See TableFieldDefinition in table-generator.ts for more details
 * for how to build tableFieldDefinitions.
 *
 * NOTE: this mixin requires that Outputable also be mixed in.
 */
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

/**
 * An API command that has complex input and complex output. This
 * would normally be used for POST and PUT methods (though in the case of PUT
 * one of the "Selecting" classes that extend this is more often appropriate).
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

/* eslint-enable no-process-exit */
/* eslint-enable @typescript-eslint/ban-ts-comment */
