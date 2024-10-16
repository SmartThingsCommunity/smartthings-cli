import {
	type IdTranslationFunction,
	type ListDataFunction,
	type LookupDataFunction,
} from './io-defs.js'
import { outputItem, type OutputItemConfig } from './output-item.js'
import {
	outputList,
	outputListBuilder,
	type OutputListConfig,
	type OutputListFlags,
} from './output-list.js'
import { stringTranslateToId } from './command-util.js'
import { type SmartThingsCommand } from './smartthings-command.js'


export type OutputItemOrListFlags = OutputListFlags
export const outputItemOrListBuilder = outputListBuilder
export type OutputItemOrListConfig<O extends object, L extends object = O> =
	OutputItemConfig<O> & OutputListConfig<L>

// TODO: can probably combine these and use default type of string for ID if we put it last,
// similar to what was done for selectFromList
export async function outputItemOrListGeneric<ID, O extends object, L extends object = O>(
		command: SmartThingsCommand<OutputItemOrListFlags>,
		config: OutputItemOrListConfig<O, L>, idOrIndex: ID | string | undefined,
		listFunction: ListDataFunction<L>, getFunction: LookupDataFunction<ID, O>,
		translateToId: IdTranslationFunction<ID, L>, includeIndex = true): Promise<void> {
	if (idOrIndex) {
		const id = await translateToId(idOrIndex, listFunction)
		await outputItem<O>(command, config, () => getFunction(id))
	} else {
		await outputList<L>(command, config, listFunction, includeIndex)
	}
}

export async function outputItemOrList<O extends object, L extends object = O>(
		command: SmartThingsCommand<OutputItemOrListFlags>,
		config: OutputItemOrListConfig<O, L>,
		idOrIndex: string | undefined, listFunction: ListDataFunction<L>,
		getFunction: LookupDataFunction<string, O>, includeIndex = true): Promise<void> {
	return outputItemOrListGeneric<string, O, L>(
		command,
		config,
		idOrIndex,
		listFunction,
		getFunction,
		(idOrIndex, listFunction) => stringTranslateToId(config, idOrIndex, listFunction),
		includeIndex,
	)
}
