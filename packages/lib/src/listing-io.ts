import { IdTranslationFunction, ListDataFunction, LookupDataFunction, outputItem, OutputItemConfig, outputList, OutputListConfig } from './basic-io.js'
import { stringTranslateToId } from './command-util.js'
import { SmartThingsCommandInterface } from './smartthings-command.js'


export type OutputItemOrListConfig<O extends object, L extends object = O> = OutputItemConfig<O> & OutputListConfig<L>

// TODO: can probably combine these and use default type of string for ID if we put it last, similar to as was done for selectFromList
export async function outputItemOrListGeneric<ID, O extends object, L extends object = O>(command: SmartThingsCommandInterface,
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
outputItemOrListGeneric.flags = outputList.flags

export async function outputItemOrList<O extends object, L extends object = O>(command: SmartThingsCommandInterface,
		config: OutputItemOrListConfig<O, L>,
		idOrIndex: string | undefined, listFunction: ListDataFunction<L>,
		getFunction: LookupDataFunction<string, O>, includeIndex = true): Promise<void> {
	return outputItemOrListGeneric<string, O, L>(command, config, idOrIndex, listFunction, getFunction,
		(idOrIndex, listFunction) => stringTranslateToId(config, idOrIndex, listFunction), includeIndex)
}
outputItemOrList.flags = outputItemOrListGeneric.flags
