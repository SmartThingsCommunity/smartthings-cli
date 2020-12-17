import { IdTranslationFunction, ListDataFunction, LookupDataFunction, outputItem, outputList, Sorting } from './basic-io'
import { stringTranslateToId } from './command-util'
import { CommonOutputProducer } from './format'
import { SmartThingsCommandInterface } from './smartthings-command'
import { TableFieldDefinition } from './table-generator'


export type ListingOutputCommand<O, L> = SmartThingsCommandInterface & Sorting & CommonOutputProducer<O> & {
	listTableFieldDefinitions?: TableFieldDefinition<L>[]
}
export async function outputGenericListing<ID, O, L>(command: ListingOutputCommand<O, L>,
		idOrIndex: ID | string | undefined, listFunction: ListDataFunction<L>, getFunction: LookupDataFunction<ID, O>,
		translateToId: IdTranslationFunction<ID, L>, includeIndex = true): Promise<void> {
	if (idOrIndex) {
		const id = await translateToId(idOrIndex, listFunction)
		await outputItem<O>(command, () => getFunction(id))
	} else {
		await outputList<L>(command, listFunction, includeIndex)
	}
}
outputGenericListing.flags = outputList.flags

export async function outputListing<O, L>(command: ListingOutputCommand<O, L>,
		idOrIndex: string | undefined, listFunction: ListDataFunction<L>,
		getFunction: LookupDataFunction<string, O>, includeIndex = true): Promise<void> {
	return outputGenericListing<string, O, L>(command, idOrIndex, listFunction, getFunction,
		(idOrIndex, listFunction) => stringTranslateToId(command, idOrIndex, listFunction), includeIndex)
}
outputListing.flags = outputGenericListing.flags
