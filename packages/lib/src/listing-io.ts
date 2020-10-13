import { isIndexArgument } from './api-command'
import { formatAndWriteItem, ListDataFunction, LookupDataFunction, CommonOutputProducer } from './basic-io'
import { listTableFormatter, sort, writeOutput } from './output'
import { buildOutputFormatter } from './output-builder'
import { SmartThingsCommand } from './smartthings-command'
import { TableFieldDefinition } from './table-generator'


// TODO: rename and maybe export
async function newStringTranslateToId<L>(command: { readonly primaryKeyName: string; readonly sortKeyName: string },
		idOrIndex: string,
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


interface ListingOutputCommandBase<L> extends SmartThingsCommand {
	primaryKeyName: string
	sortKeyName: string
	listTableFieldDefinitions?: TableFieldDefinition<L>[]
}
export type ListingOutputCommand<O, L> = ListingOutputCommandBase<L> & CommonOutputProducer<O>
export async function outputGenericListing<ID, O, L>(command: ListingOutputCommand<O, L>,
		idOrIndex: ID | string | undefined, listFunction: ListDataFunction<L>, getFunction: LookupDataFunction<ID, O>,
		translateToId: (idOrIndex: ID | string, listFunction: ListDataFunction<L>) => Promise<ID>): Promise<void> {
	if (idOrIndex) {
		const id: ID = await translateToId(idOrIndex, listFunction)
		const item = await getFunction(id)

		await formatAndWriteItem(command, item)
	} else {
		const list = sort(await listFunction(), command.sortKeyName)
		const listTableFieldDefinitions = command.listTableFieldDefinitions ?? [command.sortKeyName, command.primaryKeyName]
		const commonFormatter = listTableFormatter<L>(command.tableGenerator, listTableFieldDefinitions, true)
		const outputFormatter = buildOutputFormatter(command, undefined, commonFormatter)
		await writeOutput(outputFormatter(list), command.flags.output)
	}
}
outputGenericListing.flags = buildOutputFormatter.flags

export async function outputListing<O, L>(command: ListingOutputCommand<O, L>,
		idOrIndex: string | undefined,
		listFunction: ListDataFunction<L>,
		getFunction: LookupDataFunction<string, O>): Promise<void> {
	return outputGenericListing<string, O, L>(command, idOrIndex, listFunction, getFunction,
		(idOrIndex, listFunction) => newStringTranslateToId(command, idOrIndex, listFunction))
}
outputListing.flags = outputGenericListing.flags

// TODO: selecting is base so ...
// TODO: selectingInputOutput is base so ...
// TODO: selectingOutput is base so ...
// TODO: selectingInput is base so ...
// TODO: nestedListingOutput is base so ...
// TODO: nestedSelecting is base so ...


// TODO: separate files; maybe something like base-io, listing-io, selecting-io and nested-io
