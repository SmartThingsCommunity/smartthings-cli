import { readFile } from 'fs/promises'

import {
	formatFromFilename,
	IOFormat,
	parseJSONOrYAML,
	readDataFromStdin,
	stdinIsTTY,
} from '../io-util.js'


export type InputProcessor<T> = {
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
	hasInput(): boolean | Promise<boolean>

	/**
	 * Actually read the input. This should not be called if `hasInput` returned false and should
	 * ensure further calls to `ioFormat` return appropriate data.
	 */
	read(): Promise<T>
}


export const fileInputProcessor = <T>(filename?: string): InputProcessor<T> => {
	const ioFormat: IOFormat = filename ? formatFromFilename(filename) : 'json'

	const hasInput = (): boolean => !!filename

	const read = async (): Promise<T> => {
		if (!filename) {
			throw ReferenceError('read called when hasInput returns false')
		}

		return parseJSONOrYAML(await readFile(filename, 'utf-8'), filename)
	}

	return { ioFormat, hasInput, read }
}

export const stdinInputProcessor = <T>(): InputProcessor<T> => {
	// Could be JSON or YAML but it's not really worth trying to figure out which.
	const ioFormat = 'json'
	let inputData: string | undefined = undefined

	const hasInput = async (): Promise<boolean> => {
		if (inputData === undefined && !stdinIsTTY()) {
			inputData = await readDataFromStdin()
		}
		return !!inputData
	}

	const read = async (): Promise<T> => {
		if (!inputData) {
			throw Error('invalid state; `hasInput` was not called or returned false')
		}
		return parseJSONOrYAML(inputData, 'stdin')
	}

	return { ioFormat, hasInput, read }
}

/**
 * Build an input processor given the necessary functions for doing so.
 */
export function inputProcessor<T>(hasInput: () => boolean | Promise<boolean>, read: () => Promise<T>,
		ioFormat: IOFormat = 'common'): InputProcessor<T> {
	return { ioFormat, hasInput, read }
}

export type CommandLineInputCommand<T> = {
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

export type UserInputCommand<T> = {
	getInputFromUser(): Promise<T>
}
/**
 * Shortcut for building an InputProcessor that queries the user for complex input using a
 * Q & A session using standard methods in `command` defined in `UserInputCommand`. This should
 * always be the last one in the list since input processors are checked in order and this can
 * always provide data.
 */
export function userInputProcessor<T>(command: UserInputCommand<T>): InputProcessor<T>
export function userInputProcessor<T>(readFn: () => Promise<T>): InputProcessor<T>
export function userInputProcessor<T>(commandOrReadFn: UserInputCommand<T> | (() => Promise<T>)): InputProcessor<T> {
	if (typeof commandOrReadFn === 'function') {
		return inputProcessor(() => true, commandOrReadFn)
	}
	return inputProcessor(() => true, () => commandOrReadFn.getInputFromUser())
}

export const combinedInputProcessor = <T>(inputProcessor: InputProcessor<T>, ...moveInputProcessors: InputProcessor<T>[]): InputProcessor<T> => {
	const inputProcessors: InputProcessor<T>[] = [inputProcessor, ...moveInputProcessors]
	let selectedInputProcessor: InputProcessor<T> | undefined
	let _ioFormat: IOFormat | undefined = undefined

	const hasInput = async (): Promise<boolean> => {
		for (const inputProcessor of inputProcessors) {
			const hasInputResult = inputProcessor.hasInput()
			const hasInput = typeof hasInputResult === 'boolean' ? hasInputResult : await hasInputResult
			if (hasInput) {
				selectedInputProcessor = inputProcessor
				return true
			}
		}
		return false
	}

	const read = async (): Promise<T> => {
		if (!selectedInputProcessor) {
			throw ReferenceError('read called when hasInput returns false')
		}

		const retVal = selectedInputProcessor.read()
		_ioFormat = selectedInputProcessor.ioFormat
		return retVal
	}

	return {
		get ioFormat() {
			if (!_ioFormat) {
				throw new ReferenceError('ioFormat called before read')
			}
			return _ioFormat
		},
		hasInput,
		read,
	}
}
