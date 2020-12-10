import { isIndexArgument } from './api-command'
import { outputItem, outputList, IdTranslationFunction, CommonOutputProducer,
	ListDataFunction, LookupDataFunction, Sorting } from './basic-io'
import { sort } from './output'
import { SmartThingsCommandInterface } from './smartthings-command'
import { TableFieldDefinition } from './table-generator'


// TODO: drop "new" from name when old one is gone
async function newStringTranslateToId<L>(command: Sorting, idOrIndex: string,
		listFunction: ListDataFunction<L>): Promise<string> {
	if (!isIndexArgument(idOrIndex)) {
		// idOrIndex isn't a valid index so has to be an id (or bad)
		return idOrIndex
	}

	const index = Number.parseInt(idOrIndex)

	const items = sort(await listFunction(), command.sortKeyName)
	const matchingItem: L = items[index - 1]
	if (!(command.primaryKeyName in matchingItem)) {
		throw Error(`did not find key ${command.primaryKeyName} in data`)
	}
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const pk = matchingItem[command.primaryKeyName]
	if (typeof pk === 'string') {
		return pk
	}

	throw Error(`invalid type ${typeof pk} for primary key`  +
		` ${command.primaryKeyName} in ${JSON.stringify(matchingItem)}`)
}

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
		(idOrIndex, listFunction) => newStringTranslateToId(command, idOrIndex, listFunction), includeIndex)
}
outputListing.flags = outputGenericListing.flags

// TODO: selecting is base so ...
// TODO: selectingInputOutput is base so ...
// TODO: selectingOutput is base so ...
// TODO: selectingInput is base so ...
// TODO: nestedListingOutput is base so ...
// TODO: nestedSelecting is base so ...


// TODO: separate files; maybe something like base-io, listing-io, selecting-io and nested-io
