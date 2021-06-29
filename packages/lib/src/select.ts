import { IdRetrievalFunction, ListDataFunction, Naming, outputList, Sorting } from './basic-io'
import { stringGetIdFromUser } from './command-util'
import { CommonListOutputProducer } from './format'
import { SmartThingsCommandInterface } from './smartthings-command'


export type SelectingConfig<L> = Sorting & Naming & CommonListOutputProducer<L>

export const indefiniteArticleFor = (name: string): string => name.match(/^[aeiou]/i) ? 'an' : 'a'

function promptFromNaming(config: Naming): string | undefined {
	return config.itemName ? `Select ${indefiniteArticleFor(config.itemName)} ${config.itemName}.` : undefined
}

export async function selectGeneric<ID, L>(command: SmartThingsCommandInterface, config: SelectingConfig<L>,
		preselectedId: ID | undefined, listItems: ListDataFunction<L>,
		getIdFromUser: IdRetrievalFunction<ID, L>, promptMessage?: string, autoChoose = false, optional = false): Promise<ID> {
	if (preselectedId) {
		return preselectedId
	}

	const items = await listItems()
	if (autoChoose && items.length === 1) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore Typescript can't check that run-time variable `config.primaryKeyName` exists.
		return items[0][config.primaryKeyName]
	}
	const list = await outputList(command, config, async () => items, true, true)
	if (list.length === 0) {
		// Nothing was found; user was already notified.
		command.exit(0)
	}

	return await getIdFromUser(config, list, promptMessage ?? promptFromNaming(config), optional)
}

/**
 * Process selection of an item from a list. Use `preselectedId` if specified and ask the user to
 * choose from items returned by `listItems` if not.
 *
 * @param command The command that is requesting the selection.
 * @param config Configuration for primary key, sorting key and fields to display when asking the user for a selection.
 * @param preselectedId If the value passed here is truthy, it is simply returned and no further processing is done.
 * @param listItems A function that returns the list of items to display.
 * @param promptMessage A message to display to the user
 * @param autoChoose Set this to true if you want to automatically choose for the user if `listItems` returns exactly one item.
 */
export async function selectFromList<L>(command: SmartThingsCommandInterface, config: SelectingConfig<L>,
		preselectedId: string | undefined, listItems: ListDataFunction<L>, promptMessage?: string, autoChoose = false): Promise<string> {
	return selectGeneric(command, config, preselectedId, listItems, stringGetIdFromUser, promptMessage, autoChoose)
}
