import { type Argv } from 'yargs'

import { formatAndWriteItem, type FormatAndWriteItemConfig } from './format.js'
import { type InputProcessorFlags } from './input-builder.js'
import { inputItem, inputItemBuilder } from './input-item.js'
import { type InputProcessor } from './input-processor.js'
import { type ActionFunction } from './io-defs.js'
import { writeOutput } from './output.js'
import {
	buildOutputFormatter,
	buildOutputFormatterBuilder,
	type BuildOutputFormatterFlags,
} from './output-builder.js'
import { type SmartThingsCommand, type SmartThingsCommandFlags } from './smartthings-command.js'


export type InputAndOutputItemFlags = InputProcessorFlags & BuildOutputFormatterFlags & {
	dryRun?: boolean
}
export type InputAndOutputItemConfig<O extends object> = FormatAndWriteItemConfig<O>
export const inputAndOutputItemBuilder = <T extends SmartThingsCommandFlags>(yargs: Argv<T>): Argv<T & InputAndOutputItemFlags> =>
	inputItemBuilder(buildOutputFormatterBuilder(yargs))
		.option('dry-run', { alias: 'd', describe: "produce JSON but don't actually submit", type: 'boolean' })
/**
 * This is the main function used in most create and update commands. It parses input and passes it
 * on to the executeAction function parameter.
 *
 * By default input is only accepted from stdin or a file specified by the --input command line
 * flag as JSON or YAML but alternate input processors can be specified as arguments. They need to
 * implement the InputProcessor<I> interface. The most common use-case for this is to use a Q&A
 * session with the user to build up the input. Another possible use-case would be building input
 * from command line flags or arguments. Input processors are called in the order they are specified
 * and the first one to return data is used.
 */
export async function inputAndOutputItem<I extends object, O extends object = I>(command: SmartThingsCommand<InputAndOutputItemFlags>, config: InputAndOutputItemConfig<O>,
		executeAction: ActionFunction<void, I, O>, ...alternateInputProcessors: InputProcessor<I>[]): Promise<void> {
	const [itemIn, defaultIOFormat] = await inputItem<I>(command.flags, ...alternateInputProcessors)
	if (command.flags.dryRun) {
		const outputFormatter = buildOutputFormatter(command.flags, command.cliConfig, defaultIOFormat)
		await writeOutput(outputFormatter(itemIn), command.flags.output)
	} else {
		const item = await executeAction(undefined, itemIn)
		await formatAndWriteItem(command, config, item, defaultIOFormat)
	}
}
