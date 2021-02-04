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


export async function formatAndWriteItem<O>(command: SmartThingsCommandInterface,
		config: CommonOutputProducer<O>, item: O, defaultIOFormat?: IOFormat): Promise<void> {
	const commonFormatter = 'buildTableOutput' in config
		? (data: O) => config.buildTableOutput(data)
		: itemTableFormatter<O>(command.tableGenerator, config.tableFieldDefinitions)
	const outputFormatter = buildOutputFormatter(command, defaultIOFormat, commonFormatter)
	await writeOutput(outputFormatter(item), command.flags.output)
}

export async function formatAndWriteList<L>(command: SmartThingsCommandInterface,
		config: CommonListOutputProducer<L> & Naming,
		list: L[], includeIndex = false): Promise<void> {
	let commonFormatter: OutputFormatter<L[]>
	if (list.length === 0) {
		const pluralName = config.pluralItemName ?? (config.itemName ? `${config.itemName}s` : 'items')
		commonFormatter = () => `no ${pluralName} found`
	} else if ('buildListTableOutput' in config) {
		commonFormatter = data => config.buildListTableOutput(data)
	} else if ('listTableFieldDefinitions' in config) {
		commonFormatter = listTableFormatter<L>(command.tableGenerator, config.listTableFieldDefinitions, includeIndex)
	} else {
		commonFormatter = listTableFormatter<L>(command.tableGenerator, [config.sortKeyName, config.primaryKeyName], includeIndex)
	}
	const outputFormatter = buildOutputFormatter(command, undefined, commonFormatter)
	await writeOutput(outputFormatter(list), command.flags.output)
}
