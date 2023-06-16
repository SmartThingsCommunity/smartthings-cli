import { Naming, Sorting } from './basic-io.js'
import { IOFormat } from '../io-util.js'
import { itemTableFormatter, listTableFormatter, writeOutput, OutputFormatter } from './output.js'
import { buildOutputFormatter, buildOutputFormatterBuilder, BuildOutputFormatterFlags } from './output-builder.js'
import { SmartThingsCommand } from './smartthings-command.js'
import { TableFieldDefinition } from '../table-generator.js'


export type TableCommonOutputProducer<O extends object> = {
	tableFieldDefinitions: TableFieldDefinition<O>[]
}
export type CustomCommonOutputProducer<O extends object> = {
	buildTableOutput(data: O): string
}
export type CommonOutputProducer<O extends object> = TableCommonOutputProducer<O> | CustomCommonOutputProducer<O>

export type CommonListOutputProducer<L extends object> = Sorting<L> & {
	listTableFieldDefinitions?: TableFieldDefinition<L>[]
	buildListTableOutput?(data: L[]): string
}

export type FormatAndWriteItemFlags = BuildOutputFormatterFlags
export const formatAndWriteItemBuilder = buildOutputFormatterBuilder
export type FormatAndWriteItemConfig<O extends object> = CommonOutputProducer<O>
/**
 * Format and output the given item.
 *
 * @param command The command outputting the list.
 * @param config Configuration for how to write the list. This must include either a list of
 *   table field definitions called `tableFieldDefinitions` or a function to write common-formatted
 *   output called `buildTableOutput`.
 * @param item The item to be written.
 * @param defaultIOFormat The default IOFormat to use. This should be used when a command also takes
 *   input so the output can default to the input format.
 */
export async function formatAndWriteItem<O extends object>(command: SmartThingsCommand<FormatAndWriteItemFlags>,
		config: FormatAndWriteItemConfig<O>, item: O, defaultIOFormat?: IOFormat): Promise<void> {
	const commonFormatter = 'buildTableOutput' in config
		? (data: O) => config.buildTableOutput(data)
		: itemTableFormatter<O>(command.tableGenerator, config.tableFieldDefinitions)
	const outputFormatter = buildOutputFormatter(command.flags, command.cliConfig, defaultIOFormat, commonFormatter)
	await writeOutput(outputFormatter(item), command.flags.output)
}

export type FormatAndWriteListFlags = BuildOutputFormatterFlags
export const formatAndWriteListBuilder = buildOutputFormatterBuilder
export type FormatAndWriteListConfig<L extends object> = CommonListOutputProducer<L> & Naming & Sorting<L>
/**
 * Format and output the given list.
 *
 * @param command The command outputting the list.
 * @param config Configuration for how to write the list. This must include either a list of
 *   table field definitions called `listTableFieldDefinitions` or a function to write
 *   common-formatted output called `buildTableOutput`.
 * @param list The items to be written.
 * @param includeIndex Set this to true if you want to include an index in the output.
 * @param forUserQuery Set this to true if you're displaying this to the user for a question. This
 *   will force output to stdout and skip the JSON/YAML formatters.
 */
export async function formatAndWriteList<L extends object>(command: SmartThingsCommand<FormatAndWriteListFlags>,
		config: FormatAndWriteListConfig<L>, list: L[], includeIndex = false,
		forUserQuery = false): Promise<void> {
	let commonFormatter: OutputFormatter<L[]>
	if (list.length === 0) {
		const pluralName = config.pluralItemName ?? (config.itemName ? `${config.itemName}s` : 'items')
		commonFormatter = () => `no ${pluralName} found`
	} else if (config.buildListTableOutput) {
		const buildListTableOutput = config.buildListTableOutput
		commonFormatter = data => buildListTableOutput(data)
	} else if (config.listTableFieldDefinitions) {
		commonFormatter = listTableFormatter<L>(command.tableGenerator, config.listTableFieldDefinitions, includeIndex)
	} else if (config.sortKeyName) {
		commonFormatter = listTableFormatter<L>(command.tableGenerator, [config.sortKeyName, config.primaryKeyName], includeIndex)
	} else {
		commonFormatter = listTableFormatter<L>(command.tableGenerator, [config.primaryKeyName], includeIndex)
	}
	const outputFormatter = forUserQuery
		? commonFormatter
		: buildOutputFormatter(command.flags, command.cliConfig, undefined, commonFormatter)
	await writeOutput(outputFormatter(list), forUserQuery ? undefined : command.flags.output)
}
