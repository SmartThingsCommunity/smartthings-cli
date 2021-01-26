import { ActionFunction, IdRetrievalFunction, ListDataFunction, outputList, Sorting } from './basic-io'
import { stringGetIdFromUser } from './command-util'
import { CommonListOutputProducer, CommonOutputProducer, formatAndWriteItem } from './format'
import { SmartThingsCommandInterface } from './smartthings-command'


// Functions in this file support commands that act on an item. The biggest difference
// between these and the methods from listing-io.ts is that they list items and immediately
// query the user for an item to act on (if one wasn't specified on the command line). This
// makes them safe to use for actions that make changes to the item or delete it.

// TODO: implement equivalent of acceptIndexId from old code

export type SelectingCommand<L> = SmartThingsCommandInterface & Sorting & CommonListOutputProducer<L>

export async function selectGeneric<ID, L>(command: SelectingCommand<L>, id: ID | undefined,
		listItems: ListDataFunction<L>, getIdFromUser: IdRetrievalFunction<ID, L>): Promise<ID> {
	if (id) {
		return id
	}

	const list = await outputList(command, listItems, true)
	if (list.length === 0) {
		// Nothing was found; user was already notified.
		command.exit(0)
	}

	return await getIdFromUser(command, list)
}

export async function select<L>(command: SelectingCommand<L>, id: string | undefined,
		listItems: ListDataFunction<L>): Promise<string> {
	return selectGeneric(command, id, listItems, stringGetIdFromUser)
}

/**
 * Process a command that selects and item (e.g. a device), performs some action on that device.
 * This method is mainly here to combine shared code for the methods below but could be used
 * elsewhere in circumstances where unusual output might be necessary.
 *
 * @param command The command itself which conforms to the `SelectingCommand` type.
 * @param id The id of the item to act on, or undefined if the user should be asked to select one.
 * @param listItems A function that returns a list of all items which will be used to build the
 *   list of the user to choose from when `id` is undefined.
 * @param executeAction The function that performs the action.
 * @param getIdFromUser A function that queries the user into a for an item given a list of them.
 *
 * @returns a tuple containing the id of the item acted on and the result of the action function.
 */
export async function selectAndActOnGeneric<ID, O, L>(command: SelectingCommand<L>,
		id: ID | undefined, listItems: ListDataFunction<L>, executeAction: ActionFunction<ID, void, O>,
		getIdFromUser: IdRetrievalFunction<ID, L>, successMessage?: string): Promise<[ID, O]> {
	let chosenId: ID
	if (id) {
		chosenId = id
	} else {
		const list = await outputList(command, listItems, true)
		if (list.length === 0) {
			// Nothing was found; user was already notified.
			command.exit(0)
		}
		chosenId = await getIdFromUser(command, list)
	}
	const updatedItem = await executeAction(chosenId)

	if (successMessage) {
		process.stdout.write(`${successMessage.replace('{{id}}', JSON.stringify(chosenId))}\n`)
	}

	return [chosenId, updatedItem]
}

/**
 * Process a command that selects and item (e.g. a device), performs some action on that device
 * and then simply states that the action has completed. This is useful for actions that don't
 * return data, like deleting an item.
 *
 * @param command The command itself which conforms to the `SelectingCommand` type.
 * @param id The id of the item to act on, or undefined if the user should be asked to select one.
 * @param listItems A function that returns a list of all items which will be used to build the
 *   list of the user to choose from when `id` is undefined.
 * @param executeAction The function that performs the action.
 * @param successMessage The message that should be displayed upon successful completion of the
 *   action. (Successful completion is defined as `actionFunction` not throwing any exceptions.)
 *
 * @returns the id selected and acted on by `actionFunction`
 */
export async function selectAndActOn<L>(command: SelectingCommand<L>, id: string | undefined,
		listItems: ListDataFunction<L>, executeAction: ActionFunction<string, void, void>,
		successMessage: string): Promise<string> {
	const [computedId] = await selectAndActOnGeneric<string, void, L>(command, id, listItems,
		executeAction, stringGetIdFromUser, successMessage)
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
 * @param listItems A function that returns a list of all items which will be used to build the
 *   list of the user to choose from when `id` is undefined.
 * @param executeAction The function that performs the action.
 * @param getIdFromUser A function that queries the user into a for an item given a list of them.
 *
 * @returns a tuple containing the id of the item acted on and the result of the action function.
 */
export async function selectActOnAndOutputGeneric<ID, O, L>(command: SelectingOutputCommand<O, L>,
		id: ID | undefined, listItems: ListDataFunction<L>, executeAction: ActionFunction<ID, void, O>,
		getIdFromUser: IdRetrievalFunction<ID, L>): Promise<[ID, O]> {
	const [computedId, updatedItem] = await selectAndActOnGeneric(command, id, listItems, executeAction, getIdFromUser)
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
 * @param listItems A function that returns a list of all items which will be used to build the
 *   list of the user to choose from when `id` is undefined.
 * @param executeAction The function that performs the action.
 *
 * @returns a tuple containing the id of the item acted on and the result of the action function.
 */
export async function selectActOnAndOutput<O, L>(command: SelectingOutputCommand<O, L>,
		id: string | undefined, listItems: ListDataFunction<L>,
		executeAction: ActionFunction<string, void, O>): Promise<[string, O]> {
	return selectActOnAndOutputGeneric<string, O, L>(command, id, listItems, executeAction, stringGetIdFromUser)
}
selectActOnAndOutput.flags = selectActOnAndOutputGeneric.flags
