import { type InputProcessor } from './input-processor.js'
import {
	buildInputProcessor,
	inputProcessorBuilder,
	type InputProcessorFlags,
} from './input-builder.js'
import { type IOFormat } from '../io-util.js'


export type InputItemFlags = InputProcessorFlags
export const inputItemBuilder = inputProcessorBuilder
export async function inputItem<I extends object>(flags: InputItemFlags,
		...alternateInputProcessors: InputProcessor<I>[]): Promise<[I, IOFormat]> {
	const inputProcessor = buildInputProcessor<I>(flags, ...alternateInputProcessors)
	const hasInputResult = inputProcessor.hasInput()
	const hasInput = typeof hasInputResult === 'boolean' ? hasInputResult : await hasInputResult
	if (hasInput) {
		const item = await inputProcessor.read()
		return [item, inputProcessor.ioFormat]
	} else {
		// TODO: standardize error handling
		throw Error('input is required either via file specified with --input option or from stdin')
	}
}
