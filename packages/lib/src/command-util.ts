import inquirer from 'inquirer'

import { ListDataFunction, Naming, Sorting } from './basic-io'
import { sort } from './output'


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

export async function stringTranslateToId<L>(config: Sorting & Naming, idOrIndex: string,
		listFunction: ListDataFunction<L>): Promise<string> {
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
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const pk = matchingItem[primaryKeyName]
	if (typeof pk === 'string') {
		return pk
	}

	throw Error(`invalid type ${typeof pk} for primary key` +
		` ${primaryKeyName} in ${JSON.stringify(matchingItem)}`)
}


export function convertToId<L>(itemIdOrIndex: string, primaryKeyName: string, sortedList: L[]): string | false {
	if (itemIdOrIndex.length === 0) {
		return false
	}
	const matchingItem = sortedList.find(item => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		return (primaryKeyName in item) && itemIdOrIndex === item[primaryKeyName]
	})
	if (matchingItem) {
		return itemIdOrIndex
	}

	if (!isIndexArgument(itemIdOrIndex)) {
		return false
	}

	const index = Number.parseInt(itemIdOrIndex)

	if (!Number.isNaN(index) && index > 0 && index <= sortedList.length) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const pk = sortedList[index - 1][primaryKeyName]
		if (typeof pk === 'string') {
			return pk
		}
		throw Error(`invalid type ${typeof pk} for primary key` +
			` ${primaryKeyName} in ${JSON.stringify(sortedList[index - 1])}`)
	}
	return false
}

export async function stringGetIdFromUser<L>(fieldInfo: Sorting, list: L[], prompt?: string): Promise<string> {
	const primaryKeyName = fieldInfo.primaryKeyName

	const itemIdOrIndex: string = (await inquirer.prompt({
		type: 'input',
		name: 'itemIdOrIndex',
		message: prompt ?? 'Enter id or index',
		validate: input => {
			return convertToId(input, primaryKeyName, list)
				? true
				: `Invalid id or index "${input}". Please enter an index or valid id.`
		},
	})).itemIdOrIndex
	const inputId = convertToId(itemIdOrIndex, primaryKeyName, list)
	if (inputId === false) {
		throw Error(`unable to convert ${itemIdOrIndex} to id`)
	}
	return inputId
}
