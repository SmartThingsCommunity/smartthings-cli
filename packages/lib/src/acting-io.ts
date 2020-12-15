import inquirer from 'inquirer'

import { isIndexArgument } from './api-command'
import { outputList, ActionFunction, ListDataFunction, IdRetrievalFunction, Sorting } from './basic-io'
import { formatAndWriteItem, CommonListOutputProducer, CommonOutputProducer } from './format'
import { SmartThingsCommandInterface } from './smartthings-command'


// Functions in this file support commands that act on an item. The biggest difference
// between these and the methods from listing-io.ts is that they list items and immediately
// query the user for an item to act on (if one wasn't specified on the command line). This
// makes them safe to use for actions that make changes to the item or delete it.

// TODO: implement equivalent of acceptIndexId from old code

// TODO: drop "new" from name when old one is gone
export async function newStringGetIdFromUser<L>(primaryKeyName: string, list: L[]): Promise<string> {
	const convertToId = (itemIdOrIndex: string): string | false => {
		if (itemIdOrIndex.length === 0) {
			return false
		}
		const matchingItem = list.find(item => {
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

		if (!Number.isNaN(index) && index > 0 && index <= list.length) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			const pk = list[index - 1][primaryKeyName]
			if (typeof pk === 'string') {
				return pk
			} else {
				throw Error(`invalid type ${typeof pk} for primary key`  +
					` ${primaryKeyName} in ${JSON.stringify(list[index - 1])}`)
			}
		} else {
			return false
		}
	}

	const itemIdOrIndex: string = (await inquirer.prompt({
		type: 'input',
		name: 'itemIdOrIndex',
		message: 'Enter id or index',
		validate: (input) => {
			return convertToId(input)
				? true
				: `Invalid id or index ${itemIdOrIndex}. Please enter an index or valid id.`
		},
	})).itemIdOrIndex
	const inputId = convertToId(itemIdOrIndex)
	if (inputId === false) {
		throw Error(`unable to convert ${itemIdOrIndex} to id`)
	}
	return inputId
}


export type SelectingCommand<L> = SmartThingsCommandInterface & Sorting & CommonListOutputProducer<L>

/**
 * Process a command that selects and item (e.g. a device), performs some action on that device.
 * This method is mainly here to combine shared code for the methods below but could be used
 * elsewhere in circumstances where unusual output might be necessary.
 *
 * @param command The command itself which conforms to the `SelectingCommand` type.
 * @param id The id of the item to act on, or undefined if the user should be asked to select one.
 * @param listFunction A function that returns a list of all items which will be used to build the
 *   list of the user to choose from when `id` is undefined.
 * @param actionFunction The function that performs the action.
 * @param getIdFromUser A function that queries the user into a for an item given a list of them.
 *
 * @returns a tuple containing the id of the item acted on and the result of the action function.
 */
export async function selectAndActOnGeneric<ID, O, L>(command: SelectingCommand<L>,
		id: ID | undefined, listFunction: ListDataFunction<L>, actionFunction: ActionFunction<ID, O>,
		getIdFromUser: IdRetrievalFunction<ID, L>): Promise<[ID, O]> {
	let computedId: ID
	if (id) {
		computedId = id
	} else {
		const list = await outputList(command, listFunction, true)
		if (list.length === 0) {
			// Nothing was found; user was already notified.
			command.exit(0)
		}
		computedId = await getIdFromUser(command.primaryKeyName, list)
	}
	const updatedItem = await actionFunction(computedId)
	return [computedId, updatedItem]
}
selectActOnAndOutputGeneric.flags = outputList.flags

/**
 * Process a command that selects and item (e.g. a device), performs some action on that device
 * and then simply states that the action has completed. This is useful for actions that don't
 * return data, like deleting an item.
 *
 * @param command The command itself which conforms to the `SelectingCommand` type.
 * @param id The id of the item to act on, or undefined if the user should be asked to select one.
 * @param listFunction A function that returns a list of all items which will be used to build the
 *   list of the user to choose from when `id` is undefined.
 * @param actionFunction The function that performs the action.
 * @param successMessage The message that should be displayed upon successful completion of the
 *   action. (Successful completion is defined as `actionFunction` not throwing any exceptions.)
 *
 * @returns the id selected and acted on by `actionFunction`
 */
export async function selectAndActOn<L>(command: SelectingCommand<L>,
		id: string | undefined, listFunction: ListDataFunction<L>,
		actionFunction: ActionFunction<string, void>, successMessage: string): Promise<string> {
	const [computedId] = await selectAndActOnGeneric<string, void, L>(command, id, listFunction,
		actionFunction, newStringGetIdFromUser)
	process.stdout.write(`${successMessage.replace('{{id}}', JSON.stringify(computedId))}\n`)
	return computedId
}


export type SelectingOutputCommand<O, L> = SelectingCommand<L> & CommonOutputProducer<O>

/**
 * Process a command that selects an item (e.g. a device), performs some action on that device
 * and then outputs the results. Unless your ids are not simple strings, you probably want to
 * use `selectActOnAndOutput` below instead.
 *
 * @param command The command itself which conforms to the `SelectingOutputCommand` type.
 * @param id The id of the item to act on, or undefined if the user should be asked to select one.
 * @param listFunction A function that returns a list of all items which will be used to build the
 *   list of the user to choose from when `id` is undefined.
 * @param actionFunction The function that performs the action.
 * @param getIdFromUser A function that queries the user into a for an item given a list of them.
 *
 * @returns a tuple containing the id of the item acted on and the result of the action function.
 */
export async function selectActOnAndOutputGeneric<ID, O, L>(command: SelectingOutputCommand<O, L>,
		id: ID | undefined, listFunction: ListDataFunction<L>, actionFunction: ActionFunction<ID, O>,
		getIdFromUser: IdRetrievalFunction<ID, L>): Promise<[ID, O]> {
	const [computedId, updatedItem] = await selectAndActOnGeneric(command, id, listFunction, actionFunction, getIdFromUser)
	await formatAndWriteItem(command, updatedItem)
	return [computedId, updatedItem]
}
selectActOnAndOutputGeneric.flags = outputList.flags

/**
 * Process a command that selects an item (e.g. a device), performs some action on that device
 * and then outputs the results.
 *
 * @param command The command itself which conforms to the `SelectingOutputCommand` type.
 * @param id The id of the item to act on, or undefined if the user should be asked to select one.
 * @param listFunction A function that returns a list of all items which will be used to build the
 *   list of the user to choose from when `id` is undefined.
 * @param actionFunction The function that performs the action.
 *
 * @returns a tuple containing the id of the item acted on and the result of the action function.
 */
export async function selectActOnAndOutput<O, L>(command: SelectingOutputCommand<O, L>,
		id: string | undefined, listFunction: ListDataFunction<L>,
		actionFunction: ActionFunction<string, O>): Promise<[string, O]> {
	return selectActOnAndOutputGeneric<string, O, L>(command, id, listFunction, actionFunction, newStringGetIdFromUser)
}
selectActOnAndOutput.flags = selectActOnAndOutputGeneric.flags
