import { CLIError } from '@oclif/errors'
import { flags } from '@oclif/command'

import { buildInputProcessor } from './input-builder'
import { IOFormat } from './io-util'
import { itemTableFormatter, listTableFormatter, writeOutput } from './output'
import { buildOutputFormatter } from './output-builder'
import { SmartThingsCommandInterface } from './smartthings-command'
import { TableFieldDefinition } from './table-generator'


export type GetDataFunction<O> = () => Promise<O>
export type ListDataFunction<L> = () => Promise<L[]>
export type LookupDataFunction<ID, O> = (id: ID) => Promise<O>
export type ExecuteCommandFunction<I, O> = (input: I) => Promise<O>


export interface TableCommonOutputProducer<O> {
	tableFieldDefinitions: TableFieldDefinition<O>[]
}
export interface CustomCommonOutputProducer<O> {
	buildTableOutput(data: O): string
}
export type CommonOutputProducer<O> = TableCommonOutputProducer<O> | CustomCommonOutputProducer<O>
export interface TableCommonListOutputProducer<L> {
	listTableFieldDefinitions: TableFieldDefinition<L>[]
}
export interface CustomCommonListOutputProducer<L> {
	buildListTableOutput(data: L[]): string
}
export type CommonListOutputProducer<L> = TableCommonListOutputProducer<L> | CustomCommonListOutputProducer<L>


export async function formatAndWriteItem<O>(command: SmartThingsCommandInterface & CommonOutputProducer<O>, item: O,
		defaultIOFormat?: IOFormat): Promise<void> {
	const commonFormatter = 'tableFieldDefinitions' in command
		? itemTableFormatter<O>(command.tableGenerator, command.tableFieldDefinitions)
		: (data: O) => command.buildTableOutput(data)
	const outputFormatter = buildOutputFormatter(command, defaultIOFormat, commonFormatter)
	await writeOutput(outputFormatter(item), command.flags.output)
}

export async function formatAndWriteList<L>(command: SmartThingsCommandInterface & CommonListOutputProducer<L>,
		list: L[]): Promise<void> {
	const commonFormatter = 'listTableFieldDefinitions' in command
		? listTableFormatter<L>(command.tableGenerator, command.listTableFieldDefinitions)
		: (data: L[]) => command.buildListTableOutput(data)
	const outputFormatter = buildOutputFormatter(command, undefined, commonFormatter)
	await writeOutput(outputFormatter(list), command.flags.output)
}

// TODO: inputItem<I>

export async function outputItem<O>(command: SmartThingsCommandInterface & CommonOutputProducer<O>,
		getData: GetDataFunction<O>): Promise<void> {
	const data = await getData()

	await formatAndWriteItem(command, data)
}
outputItem.flags = buildOutputFormatter.flags

export async function outputList<L>(command: SmartThingsCommandInterface & CommonListOutputProducer<L>,
		getData: GetDataFunction<L[]>): Promise<void> {
	const list = await getData()
	await formatAndWriteList(command, list)
}
outputList.flags = buildOutputFormatter.flags


export async function inputAndOutputItem<I, O>(command: SmartThingsCommandInterface & CommonOutputProducer<O>,
		executeCommand: ExecuteCommandFunction<I, O>) : Promise<void> {
	const inputProcessor = buildInputProcessor<I>(command)
	if (inputProcessor.hasInput()) {
		const defaultIOFormat = inputProcessor.ioFormat
		if (command.flags['dry-run']) {
			const outputFormatter = buildOutputFormatter(command, defaultIOFormat)
			await writeOutput(outputFormatter(await inputProcessor.read()), command.flags.output)
		} else {
			const item = await executeCommand(await inputProcessor.read())
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
