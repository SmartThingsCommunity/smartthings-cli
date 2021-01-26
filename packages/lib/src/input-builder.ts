import { SmartThingsCommandInterface } from './smartthings-command'
import { CombinedInputProcessor, commonIOFlags, FileInputProcessor, inputFlag, InputProcessor, StdinInputProcessor } from './input'

/**
 * Build the most common type of input processor, which can handle data from stdin, a specified
 * file and optional "user" input formats.
 *
 * The input processors are tried in this order:
 *   1. file
 *   2. stdin
 *   3. alternateInputProcessors in the order they are listed
 *
 * @param alternateInputProcessors User input processors. Most commonly this will be a single
 * input processor that asks the user questions and builds input data based on their responses.
 * Another less common use case (which might co-exist with a Q&A input processor) would be building
 * the data from command line options.
 */
export function buildInputProcessor<T>(command: SmartThingsCommandInterface,
		...alternateInputProcessors: InputProcessor<T>[]): InputProcessor<T> {
	const fileInputProcessor = new FileInputProcessor<T>(command.flags.input)
	const stdinInputProcessor = new StdinInputProcessor<T>()
	return new CombinedInputProcessor(fileInputProcessor, stdinInputProcessor, ...alternateInputProcessors)
}

buildInputProcessor.flags = {
	...commonIOFlags,
	...inputFlag,
}


// TODO: more convenience methods for making these processors more easily
