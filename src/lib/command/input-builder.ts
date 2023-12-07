import { Argv } from 'yargs'

import {
	combinedInputProcessor,
	fileInputProcessor,
	InputProcessor,
	stdinInputProcessor,
} from './input-processor.js'


export type InputProcessorFlags = {
	input?: string
}
export const inputProcessorBuilder = <T extends object>(yargs: Argv<T>): Argv<T & InputProcessorFlags> => yargs
	.option('input', { alias: 'i', describe: 'specify input file', type: 'string' })
/**
 * Build the most common type of input processor, which can handle data from stdin, a specified
 * file and optional "user" input formats.
 *
 * The input processors are tried in this order (the first found to return data is used):
 *   1. file
 *   2. stdin
 *   3. alternateInputProcessors in the order they are listed
 *
 * @param alternateInputProcessors User input processors. Most commonly this will be a single
 * input processor that asks the user questions and builds input data based on their responses.
 * Another less common use case (which might co-exist with a Q&A input processor) would be building
 * the data from command line options.
 */
export const buildInputProcessor =
	<T>(flags: InputProcessorFlags, ...alternateInputProcessors: InputProcessor<T>[]): InputProcessor<T> =>
		combinedInputProcessor(
			fileInputProcessor<T>(flags.input),
			stdinInputProcessor<T>(),
			...alternateInputProcessors,
		)
