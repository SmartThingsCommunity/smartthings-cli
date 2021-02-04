import { CLIError } from '@oclif/errors'
import { flags } from '@oclif/command'

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
export type IdRetrievalFunction<ID, L> = (command: Sorting, list: L[], promptMessage?: string) => Promise<ID>


export interface Sorting {
	primaryKeyName: string
	sortKeyName: string
}
export interface Naming {
	itemName?: string
	pluralItemName?: string
}

export async function inputItem<I>(command: SmartThingsCommandInterface,
		...alternateInputProcessors: InputProcessor<I>[]): Promise<[I, IOFormat]> {
	const inputProcessor = buildInputProcessor<I>(command, ...alternateInputProcessors)
	if (inputProcessor.hasInput()) {
		const item = await inputProcessor.read()
		return [item, inputProcessor.ioFormat]
	} else {
		throw new CLIError('input is required either via file specified with --input option or from stdin')
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
		getData: GetDataFunction<L[]>, includeIndex = false): Promise<L[]> {
	const list = sort(await getData(), config.sortKeyName)
	await formatAndWriteList(command, config, list, includeIndex)
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
	'dry-run': flags.boolean({
		char: 'd',
		description: "produce JSON but don't actually submit",
	}),
}
