import { Argv } from 'yargs'

import { formatAndWriteItem, formatAndWriteList, FormatAndWriteItemConfig, FormatAndWriteListConfig } from './format.js'
import { InputProcessor } from './input-processor.js'
import { buildInputProcessor, inputProcessorBuilder, InputProcessorFlags } from './input-builder.js'
import { IOFormat } from '../io-util.js'
import { sort, writeOutput } from './output.js'
import { buildOutputFormatter, buildOutputFormatterBuilder, BuildOutputFormatterFlags } from './output-builder.js'
import { SmartThingsCommand } from './smartthings-command.js'


export type GetDataFunction<O extends object> = () => Promise<O>
export type ListDataFunction<L extends object> = () => Promise<L[]>
export type LookupDataFunction<ID, O extends object> = (id: ID) => Promise<O>
export type ActionFunction<ID, I extends object, O extends object> = (id: ID, input: I) => Promise<O>
export type IdTranslationFunction<ID, L extends object> = (idOrIndex: ID | string, listFunction: ListDataFunction<L>) => Promise<ID>
export type IdRetrievalFunction<ID, L extends object> = (fieldInfo: Sorting<L>, list: L[], promptMessage?: string) => Promise<ID>


/**
 * This interface is used when a list is presented to the user, especially when they will have the
 * opportunity to select an item from the list.
 *
 * The primary (but not only) example of this the list/get versions of commands. Consider the
 * simple `locations` command. When specified without an id or index, it needs to present the
 * results in a consistent order. If the user specifies an index into that list when querying
 * a single location, the sort key specified here is used again to ensure the same ordering.
 */
export type Sorting<L extends object> = {
	/**
	 * The primary key used to uniquely identify this object.
	 */
	primaryKeyName: Extract<keyof L, string>

	/**
	 * The field you want to sort by when presenting a list of items.
	 */
	sortKeyName?: Extract<keyof L, string>
}

/**
 * This interface is used in configurations to help describe a named item.
 *
 * If you're writing code that uses this interface, use `itemName` or `pluralItemName` from
 * command-util to translate a `Naming` instance to a name.
 */
export type Naming = {
	/**
	 * The singular name of your item, using lowercase letters and spaces to separate words.
	 */
	itemName?: string

	/**
	 * You only need to specify the plural version of your name if adding a simple "s" is incorrect.
	 */
	pluralItemName?: string
}

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

export type OutputItemFlags = BuildOutputFormatterFlags
export const outputItemBuilder = buildOutputFormatterBuilder
export type OutputItemConfig<O extends object> = FormatAndWriteItemConfig<O>
export async function outputItem<O extends object>(command: SmartThingsCommand<OutputItemFlags>, config: OutputItemConfig<O>,
		getData: GetDataFunction<O>): Promise<O> {
	const data = await getData()

	await formatAndWriteItem(command, config, data)
	return data
}

export type OutputListFlags = BuildOutputFormatterFlags
export const outputListBuilder = buildOutputFormatterBuilder
export type OutputListConfig<L extends object> = FormatAndWriteListConfig<L>
export async function outputList<L extends object>(command: SmartThingsCommand<OutputListFlags>, config: OutputListConfig<L>,
		getData: GetDataFunction<L[]>, includeIndex = false, forUserQuery = false): Promise<L[]> {
	const list = config.sortKeyName ? sort(await getData(), config.sortKeyName) : await getData()
	await formatAndWriteList(command, config, list, includeIndex, forUserQuery)
	return list
}


export type InputAndOutputItemFlags = InputProcessorFlags & BuildOutputFormatterFlags & {
	dryRun?: boolean
}
export type InputAndOutputItemConfig<O extends object> = FormatAndWriteItemConfig<O>
export const inputAndOutputItemBuilder = <T extends InputAndOutputItemFlags>(yargs: Argv<T>): Argv<T & InputAndOutputItemFlags> =>
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
