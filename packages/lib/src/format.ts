import { Naming, Sorting } from './basic-io'
import { IOFormat } from './io-util'
import { itemTableFormatter, listTableFormatter, writeOutput, OutputFormatter } from './output'
import { buildOutputFormatter } from './output-builder'
import { SmartThingsCommandInterface } from './smartthings-command'
import { TableFieldDefinition } from './table-generator'


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
export type CommonListOutputProducer<L> = TableCommonListOutputProducer<L> | CustomCommonListOutputProducer<L> | Sorting


export async function formatAndWriteItem<O>(command: SmartThingsCommandInterface & CommonOutputProducer<O>, item: O,
		defaultIOFormat?: IOFormat): Promise<void> {
	const commonFormatter = 'tableFieldDefinitions' in command
		? itemTableFormatter<O>(command.tableGenerator, command.tableFieldDefinitions)
		: (data: O) => command.buildTableOutput(data)
	const outputFormatter = buildOutputFormatter(command, defaultIOFormat, commonFormatter)
	await writeOutput(outputFormatter(item), command.flags.output)
}

export async function formatAndWriteList<L>(command: SmartThingsCommandInterface & CommonListOutputProducer<L> & Naming,
		list: L[], includeIndex = false): Promise<void> {
	let commonFormatter: OutputFormatter<L[]>
	if (list.length === 0) {
		const pluralName = command.pluralItemName ?? (command.itemName ? `${command.itemName}s` : 'items')
		commonFormatter = () => `no ${pluralName} found`
	} else if ('listTableFieldDefinitions' in command) {
		commonFormatter = listTableFormatter<L>(command.tableGenerator, command.listTableFieldDefinitions, includeIndex)
	} else if ('buildListTableOutput' in command) {
		commonFormatter = data => command.buildListTableOutput(data)
	} else {
		commonFormatter = listTableFormatter<L>(command.tableGenerator, [command.sortKeyName, command.primaryKeyName], includeIndex)
	}
	const outputFormatter = buildOutputFormatter(command, undefined, commonFormatter)
	await writeOutput(outputFormatter(list), command.flags.output)
}
