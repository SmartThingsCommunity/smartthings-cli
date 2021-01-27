import { flags } from '@oclif/command'

import { formatFromFilename, IOFormat, parseJSONOrYAML, readDataFromStdin, readFile, stdinIsTTY } from './io-util'


// Flags common to both input and output.
export const commonIOFlags = {
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

export const inputFlag = {
	input: flags.string({
		char: 'i',
		description: 'specify input file',
	}),
}


export interface InputProcessor<T> {
	/**
	 * Return the type of input this processor retrieved. This should not be called until after
	 * data has been read via `read` so throwing an exception before that is acceptable.
	 */
	readonly ioFormat: IOFormat

	/**
	 * This is called before calling `read` to determine if there is input from this processor.
	 * The processor should return `false` to indicate `read` should not be called or `true`
	 * if calling `read` can be expected to return data.
	 */
	hasInput(): boolean

	/**
	 * Actually read the input. This should not be called if `hasInput` returned false and should
	 * ensure further calls to `ioFormat` return appropriate data.
	 */
	read(): Promise<T>
}


export class FileInputProcessor<T> implements InputProcessor<T> {
	readonly ioFormat: IOFormat

	constructor(private readonly filename?: string) {
		this.ioFormat = filename ? formatFromFilename(filename) : IOFormat.JSON
	}

	hasInput(): boolean {
		return !!this.filename
	}

	async read(): Promise<T> {
		if (!this.filename) {
			throw ReferenceError('read called when hasInput returns false')
		}

		return parseJSONOrYAML(await readFile(this.filename, 'utf-8'), this.filename)
	}
}

export class StdinInputProcessor<T> implements InputProcessor<T> {
	// Could be JSON or YAML but it's not really worth trying to figure out which.
	readonly ioFormat = IOFormat.JSON

	hasInput(): boolean {
		return !stdinIsTTY()
	}

	async read(): Promise<T> {
		return parseJSONOrYAML(await readDataFromStdin(), 'stdin')
	}
}

/**
 * Build an input processor given the necessary functions for doing so.
 */
export function inputProcessor<T>(hasInput: () => boolean, read: () => Promise<T>,
		ioFormat: IOFormat = IOFormat.COMMON): InputProcessor<T> {
	return { ioFormat, hasInput, read }
}

export interface CommandLineInputCommand<T> {
	hasCommandLineInput(): boolean
	getInputFromCommandLine(): Promise<T>
}
/**
 * Shortcut for building an InputProcessor that can build complex input from the command line
 * arguments using standard methods in `command` defined in `CommandLineInputCommand`.
 */
export function commandLineInputProcessor<T>(command: CommandLineInputCommand<T>): InputProcessor<T> {
	return inputProcessor(() => command.hasCommandLineInput(), () => command.getInputFromCommandLine())
}

export interface UserInputCommand<T> {
	getInputFromUser(): Promise<T>
}
/**
 * Shortcut for building an InputProcessor that queries the user for complex input using a
 * Q & A session using standard methods in `command` defined in `UserInputCommand`. This should
 * always be the last one in the list since input processors are checked in order and this can
 * always provide data.
 */
export function userInputProcessor<T>(command: UserInputCommand<T>): InputProcessor<T> {
	return inputProcessor(() => true, () => command.getInputFromUser())
}

export class CombinedInputProcessor<T> implements InputProcessor<T> {
	private inputProcessors: InputProcessor<T>[]
	private theInputProcessor?: InputProcessor<T>
	private _ioFormat?: IOFormat

	get ioFormat(): IOFormat {
		if (!this._ioFormat) {
			throw new ReferenceError('ioFormat called before read')
		}
		return this._ioFormat
	}

	constructor(inputProcessor: InputProcessor<T>, ...inputProcessors: InputProcessor<T>[]) {
		this.inputProcessors = [inputProcessor, ...inputProcessors]
	}

	hasInput(): boolean {
		this.theInputProcessor = this.inputProcessors.find(ip => ip.hasInput())
		return !!this.theInputProcessor
	}

	async read(): Promise<T> {
		if (!this.theInputProcessor) {
			throw ReferenceError('read called when hasInput returns false')
		}

		const retVal = this.theInputProcessor.read()
		this._ioFormat = this.theInputProcessor.ioFormat
		return retVal
	}
}
