import { type SmartThingsClient } from '@smartthings/core-sdk'

import { type APICommand } from '../api-command.js'
import { type ListDataFunction } from '../basic-io.js'
import { stringTranslateToId } from '../command-util.js'
import { type SelectFromListConfig, type SelectFromListFlags, selectFromList } from '../select.js'


export type ListItemPredicate<T extends object> = (value: T, index: number, array: T[]) => boolean

/**
 * Note that not all functions that use this interface support all options. Check the
 * `chooseThing` (e.g. `chooseDevice`) method itself.
 */
export type ChooseOptions<T extends object> = {
	allowIndex: boolean
	verbose: boolean
	useConfigDefault: boolean
	listItems?: ListDataFunction<T>
	autoChoose?: boolean
	listFilter?: ListItemPredicate<T>
}

export const chooseOptionsDefaults = <T extends object>(): ChooseOptions<T> => ({
	allowIndex: false,
	verbose: false,
	useConfigDefault: false,
	autoChoose: false,
})

export const chooseOptionsWithDefaults = <T extends object>(options: Partial<ChooseOptions<T>> | undefined): ChooseOptions<T> => ({
	...chooseOptionsDefaults(),
	...options,
})

export type ChooseFunction<T extends object> = (
	command: APICommand<SelectFromListFlags>,
	itemIdOrNameFromArg?: string,
	options?: Partial<ChooseOptions<T>>) => Promise<string>

export const createChooseFn = <T extends object>(
	config: SelectFromListConfig<T>,
	listItems: (client: SmartThingsClient) => Promise<T[]>,
): ChooseFunction<T> =>
	async (
			command: APICommand<SelectFromListFlags>,
			itemIdOrNameFromArg?: string,
			options?: Partial<ChooseOptions<T>>): Promise<string> => {
		const opts = chooseOptionsWithDefaults(options)

		// Listing items usually makes an API call which we only want to happen once so we do it
		// now and just use stub functions that return these items later as needed.
		const items = await listItems(command.client)
		const filteredItems = opts.listFilter ? items.filter(opts.listFilter) : items
		const listItemsWrapper = async (): Promise<T[]> => filteredItems

		const preselectedId = opts.allowIndex
			? await stringTranslateToId(config, itemIdOrNameFromArg, listItemsWrapper)
			: itemIdOrNameFromArg

		return selectFromList(command, config, {
			preselectedId,
			autoChoose: opts.autoChoose,
			listItems: listItemsWrapper,
		})
	}
