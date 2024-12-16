import { formatAndWriteList, type FormatAndWriteListConfig } from './format.js'
import { type GetDataFunction } from './io-defs.js'
import { sort } from './output.js'
import { buildOutputFormatterBuilder, type BuildOutputFormatterFlags } from './output-builder.js'
import { type SmartThingsCommand } from './smartthings-command.js'


export type OutputListFlags = BuildOutputFormatterFlags
export const outputListBuilder = buildOutputFormatterBuilder
export type OutputListConfig<L extends object> = FormatAndWriteListConfig<L>
export async function outputList<L extends object>(command: SmartThingsCommand<OutputListFlags>, config: OutputListConfig<L>,
		getData: GetDataFunction<L[]>, includeIndex = false, forUserQuery = false): Promise<L[]> {
	const list = config.sortKeyName ? sort(await getData(), config.sortKeyName) : await getData()
	await formatAndWriteList(command, config, list, includeIndex, forUserQuery)
	return list
}
