import { SmartThingsClient } from '@smartthings/core-sdk'

import { APICommand } from '../api-command.js'
import { ListDataFunction } from '../basic-io.js'
import { stringTranslateToId } from '../command-util.js'
import { SelectFromListConfig, SelectFromListFlags, selectFromList } from '../select.js'


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

		const listItemsWrapper = (): Promise<T[]> => listItems(command.client)

		const preselectedId = opts.allowIndex
			? await stringTranslateToId(config, itemIdOrNameFromArg, listItemsWrapper)
			: itemIdOrNameFromArg

		return selectFromList(command, config, {
			preselectedId,
			autoChoose: opts.autoChoose,
			listItems: listItemsWrapper,
		})
	}
