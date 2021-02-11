import { IdRetrievalFunction, ListDataFunction, Naming, outputList, Sorting } from './basic-io'
import { stringGetIdFromUser } from './command-util'
import { CommonListOutputProducer } from './format'
import { SmartThingsCommandInterface } from './smartthings-command'


// Functions in this file support commands that act on an item. The biggest difference
// between these and the methods from listing-io.ts is that they list items and immediately
// query the user for an item to act on (if one wasn't specified on the command line). This
// makes them safe to use for actions that make changes to the item or delete it.

// TODO: implement equivalent of acceptIndexId from old code

export type SelectingConfig<L> = Sorting & Naming & CommonListOutputProducer<L>

export async function selectGeneric<ID, L>(command: SmartThingsCommandInterface, config: SelectingConfig<L>,
		preselectedId: ID | undefined, listItems: ListDataFunction<L>,
		getIdFromUser: IdRetrievalFunction<ID, L>, promptMessage?: string): Promise<ID> {
	if (preselectedId) {
		return preselectedId
	}

	const list = await outputList(command, config, listItems, true)
	if (list.length === 0) {
		// Nothing was found; user was already notified.
		command.exit(0)
	}

	return await getIdFromUser(config, list, promptMessage)
}

export async function selectFromList<L>(command: SmartThingsCommandInterface, config: SelectingConfig<L>,
		preselectedId: string | undefined, listItems: ListDataFunction<L>, promptMessage?: string): Promise<string> {
	return selectGeneric(command, config, preselectedId, listItems, stringGetIdFromUser, promptMessage)
}
