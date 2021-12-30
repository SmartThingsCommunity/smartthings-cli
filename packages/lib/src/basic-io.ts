import { Flags, Errors } from '@oclif/core'

import { formatAndWriteItem, formatAndWriteList, CommonListOutputProducer, CommonOutputProducer } from './format'
import { InputProcessor } from './input'
import { buildInputProcessor } from './input-builder'
import { IOFormat } from './io-util'
import { sort, writeOutput } from './output'
import { buildOutputFormatter } from './output-builder'
import { SmartThingsCommandInterface } from './smartthings-command'


export type GetDataFunction<O> = () => Promise<O>
export type ListDataFunction<L> = () => Promise<L[]>
export type LookupDataFunction<ID, O> = (id: ID) => Promise<O>
export type ActionFunction<ID, I, O> = (id: ID, input: I) => Promise<O>
export type IdTranslationFunction<ID, L> = (idOrIndex: ID | string, listFunction: ListDataFunction<L>) => Promise<ID>
export type IdRetrievalFunction<ID, L> = (fieldInfo: Sorting, list: L[], promptMessage?: string) => Promise<ID>


/**
 * This interface is used when a list is presented to the user, especially when they will have the
 * opportunity to select an item from the list.
 *
 * The primary (but not only) example of this the list/get versions of commands. Consider the
 * simple `locations` command. When specified without an id or index, it needs to present the
 * results in a consistent order. If the user specifies an index into that list when querying
 * a single location, the sort key specified here is used again to ensure the same ordering.
 */
export interface Sorting {
	/**
	 * The primary key used to uniquely identify this object.
	 */
	primaryKeyName: string

	/**
	 * The field you want to sort by when presenting a list of items.
	 */
	sortKeyName: string
}

/**
 * This interface is used in configurations to help describe a named item.
 *
 * If you're writing code that uses this interface, use `itemName` or `pluralItemName` from
 * command-util to translate a `Naming` instance to a name.
 */
export interface Naming {
	/**
	 * The singular name of your item, using lowercase letters and spaces to separate words.
	 */
	itemName?: string

	/**
	 * You only need to specify the plural version of your name if adding a simple "s" is incorrect.
	 */
	pluralItemName?: string
}

export async function inputItem<I>(command: SmartThingsCommandInterface,
		...alternateInputProcessors: InputProcessor<I>[]): Promise<[I, IOFormat]> {
	const inputProcessor = buildInputProcessor<I>(command, ...alternateInputProcessors)
	if (inputProcessor.hasInput()) {
		const item = await inputProcessor.read()
		return [item, inputProcessor.ioFormat]
	} else {
		throw new Errors.CLIError('input is required either via file specified with --input option or from stdin')
	}
}
inputItem.flags = buildInputProcessor.flags

export async function outputItem<O>(command: SmartThingsCommandInterface, config: CommonOutputProducer<O>,
		getData: GetDataFunction<O>): Promise<O> {
	const data = await getData()

	await formatAndWriteItem(command, config, data)
	return data
}
outputItem.flags = buildOutputFormatter.flags

export async function outputList<L>(command: SmartThingsCommandInterface, config: CommonListOutputProducer<L> & Sorting,
		getData: GetDataFunction<L[]>, includeIndex = false, forUserQuery = false): Promise<L[]> {
	const list = sort(await getData(), config.sortKeyName)
	await formatAndWriteList(command, config, list, includeIndex, forUserQuery)
	return list
}
outputList.flags = buildOutputFormatter.flags


export async function inputAndOutputItem<I, O>(command: SmartThingsCommandInterface, config: CommonOutputProducer<O>,
		executeAction: ActionFunction<void, I, O>, ...alternateInputProcessors: InputProcessor<I>[]) : Promise<void> {
	const [itemIn, defaultIOFormat] = await inputItem<I>(command, ...alternateInputProcessors)
	if (command.flags['dry-run']) {
		const outputFormatter = buildOutputFormatter(command, defaultIOFormat)
		await writeOutput(outputFormatter(itemIn), command.flags.output)
	} else {
		const item = await executeAction(undefined, itemIn)
		await formatAndWriteItem(command, config, item, defaultIOFormat)
	}
}
inputAndOutputItem.flags = {
	...buildInputProcessor.flags,
	...buildOutputFormatter.flags,
	'dry-run': Flags.boolean({
		char: 'd',
		description: "produce JSON but don't actually submit",
	}),
}
