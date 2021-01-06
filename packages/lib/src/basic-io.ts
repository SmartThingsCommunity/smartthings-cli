import { CLIError } from '@oclif/errors'
import { flags } from '@oclif/command'

import { formatAndWriteItem, formatAndWriteList, CommonListOutputProducer, CommonOutputProducer } from './format'
import { buildInputProcessor } from './input-builder'
import { sort, writeOutput } from './output'
import { buildOutputFormatter } from './output-builder'
import { SmartThingsCommandInterface } from './smartthings-command'


export type GetDataFunction<O> = () => Promise<O>
export type ListDataFunction<L> = () => Promise<L[]>
export type LookupDataFunction<ID, O> = (id: ID) => Promise<O>
export type ActionFunction<I, O> = (input: I) => Promise<O>
export type IdTranslationFunction<ID, L> = (idOrIndex: ID | string, listFunction: ListDataFunction<L>) => Promise<ID>
export type IdRetrievalFunction<ID, L> = (command: Sorting, list: L[]) => Promise<ID>


export interface Sorting {
	primaryKeyName: string
	sortKeyName: string
}
export interface Naming {
	itemName?: string
	pluralItemName?: string
}

// TODO: inputItem<I>

export async function outputItem<O>(command: SmartThingsCommandInterface & CommonOutputProducer<O>,
		getData: GetDataFunction<O>): Promise<O> {
	const data = await getData()

	await formatAndWriteItem(command, data)
	return data
}
outputItem.flags = buildOutputFormatter.flags

export async function outputList<L>(command: SmartThingsCommandInterface & CommonListOutputProducer<L> & Sorting,
		getData: GetDataFunction<L[]>, includeIndex = false): Promise<L[]> {
	const list = sort(await getData(), command.sortKeyName)
	await formatAndWriteList(command, list, includeIndex)
	return list
}
outputList.flags = buildOutputFormatter.flags


export async function inputAndOutputItem<I, O>(command: SmartThingsCommandInterface & CommonOutputProducer<O>,
		executeCommand: ActionFunction<I, O>) : Promise<void> {
	const inputProcessor = buildInputProcessor<I>(command)
	if (inputProcessor.hasInput()) {
		const inputItem = await inputProcessor.read()
		const defaultIOFormat = inputProcessor.ioFormat
		if (command.flags['dry-run']) {
			const outputFormatter = buildOutputFormatter(command, defaultIOFormat)
			await writeOutput(outputFormatter(inputItem), command.flags.output)
		} else {
			const item = await executeCommand(inputItem)
			await formatAndWriteItem(command, item, defaultIOFormat)
		}
	} else {
		throw new CLIError('input is required either via file specified with --input option or from stdin')
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
