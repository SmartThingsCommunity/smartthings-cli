import { stringInput } from '../user-query.js'
import { ListDataFunction, Naming, Sorting } from './io-defs.js'
import { sort } from './output.js'


const indexPattern = /^[1-9][0-9]*$/

export function isIndexArgument(str: string): boolean {
	return !!str.match(indexPattern)
}

export function itemName(command: Naming): string {
	return command.itemName ?? 'item'
}

export function pluralItemName(command: Naming): string {
	return command.pluralItemName ?? (command.itemName ? `${command.itemName}s` : 'items')
}

export async function stringTranslateToId<L extends object>(config: Sorting<L> & Naming, idOrIndex: string, listFunction: ListDataFunction<L>): Promise<string>
export async function stringTranslateToId<L extends object>(config: Sorting<L> & Naming, idOrIndex: string | undefined, listFunction: ListDataFunction<L>): Promise<string | undefined>
export async function stringTranslateToId<L extends object>(config: Sorting<L> & Naming, idOrIndex: string | undefined, listFunction: ListDataFunction<L>): Promise<string | undefined> {
	if (!idOrIndex) {
		return undefined
	}

	const primaryKeyName = config.primaryKeyName
	if (!isIndexArgument(idOrIndex)) {
		// idOrIndex isn't a valid index so has to be an id (or bad)
		return idOrIndex
	}

	const index = Number.parseInt(idOrIndex)

	const items = sort(await listFunction(), config.sortKeyName)
	if (index > items.length) {
		throw Error(`invalid index ${index} (enter an id or index between 1 and ${items.length} inclusive)`)
	}
	const matchingItem: L = items[index - 1]
	if (!(primaryKeyName in matchingItem)) {
		throw Error(`did not find key ${primaryKeyName} in data`)
	}
	const pk = matchingItem[primaryKeyName]
	if (typeof pk === 'string') {
		return pk
	}
	throw Error(`invalid type ${typeof pk} for primary key` +
		` ${primaryKeyName} in ${JSON.stringify(matchingItem)}`)
}

export function convertToId<L>(itemIdOrIndex: string, primaryKeyName: Extract<keyof L, string>, sortedList: L[]): string | false {
	if (itemIdOrIndex.length === 0) {
		return false
	}
	const matchingItem = sortedList.find(item => {
		const pk = item[primaryKeyName]
		return typeof pk === 'string' && itemIdOrIndex === pk
	})
	if (matchingItem) {
		return itemIdOrIndex
	}

	if (!isIndexArgument(itemIdOrIndex)) {
		return false
	}

	const index = Number.parseInt(itemIdOrIndex)

	if (!Number.isNaN(index) && index > 0 && index <= sortedList.length) {
		const pk = sortedList[index - 1][primaryKeyName]
		if (typeof pk === 'string') {
			return pk
		}
		throw Error(`invalid type ${typeof pk} for primary key` +
			` ${primaryKeyName} in ${JSON.stringify(sortedList[index - 1])}`)
	}
	return false
}

export async function stringGetIdFromUser<L extends object>(fieldInfo: Sorting<L>, list: L[], prompt?: string): Promise<string> {
	const primaryKeyName = fieldInfo.primaryKeyName

	const itemIdOrIndex: string = await stringInput(prompt ?? 'Enter id or index', {
		validate: input =>
			convertToId(input, primaryKeyName, list)
				? true
				: `Invalid id or index "${input}". Please enter an index or valid id.`,
	})
	const inputId = convertToId(itemIdOrIndex, primaryKeyName, list)
	if (inputId === false) {
		throw Error(`unable to convert ${itemIdOrIndex} to id`)
	}
	return inputId
}
