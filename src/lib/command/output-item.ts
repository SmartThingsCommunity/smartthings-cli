import {
	formatAndWriteItem,
	type FormatAndWriteItemConfig,
} from './format.js'
import { type GetDataFunction } from './io-defs.js'
import { buildOutputFormatterBuilder, type BuildOutputFormatterFlags } from './output-builder.js'
import { SmartThingsCommand } from './smartthings-command.js'


export type OutputItemFlags = BuildOutputFormatterFlags
export const outputItemBuilder = buildOutputFormatterBuilder
export type OutputItemConfig<O extends object> = FormatAndWriteItemConfig<O>
export async function outputItem<O extends object>(command: SmartThingsCommand<OutputItemFlags>, config: OutputItemConfig<O>,
		getData: GetDataFunction<O>): Promise<O> {
	const data = await getData()

	await formatAndWriteItem(command, config, data)
	return data
}
