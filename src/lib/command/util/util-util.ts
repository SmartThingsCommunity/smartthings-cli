import { type APICommand } from '../api-command.js'
import { stringTranslateToId } from '../command-util.js'
import { type SelectFromListConfig, type SelectFromListFlags, SelectOptions, selectFromList } from '../select.js'


export type ListItemPredicate<T extends object> = (value: T, index: number, array: T[]) => boolean

/**
 * Note that a few functions using this interface don't support all options. Check the
 * `chooseThing` (e.g. `chooseDevice`) method itself. (If the `chooseThing` is implemented using
 * `createChooseFn`, it will support all of them, with the exception of `useConfigDefault`
 * which will work only if the call to `createChooseFn` includes configuration for it via the
 * `defaultValue` option.)
 */
export type ChooseOptions<T extends object> = {
	allowIndex: boolean
	verbose: boolean
	useConfigDefault: boolean
	listItems?: (command: APICommand) => Promise<T[]>
	autoChoose?: boolean
	listFilter?: ListItemPredicate<T>
	promptMessage?: string
}

export const chooseOptionsDefaults = <T extends object>(): ChooseOptions<T> => ({
	allowIndex: false,
	verbose: false,
	useConfigDefault: false,
	autoChoose: false,
})

export const chooseOptionsWithDefaults = <T extends object>(
	options: Partial<ChooseOptions<T>> | undefined,
): ChooseOptions<T> => ({
	...chooseOptionsDefaults(),
	...options,
})

export type CreateChooseFunctionOptions<T extends object> = {
	defaultValue?: Omit<Required<SelectOptions<T>>['defaultValue'], 'getItem'> & {
		getItem: (command: APICommand, id: string) => Promise<T>
	}
	customNotFoundMessage?: string
}

export type ChooseFunction<T extends object> = (
	command: APICommand<SelectFromListFlags>,
	itemIdOrNameFromArg?: string,
	options?: Partial<ChooseOptions<T>>) => Promise<string>

export const createChooseFn = <T extends object>(
	config: SelectFromListConfig<T>,
	listItems: (command: APICommand) => Promise<T[]>,
	createOptions?: CreateChooseFunctionOptions<T>,
): ChooseFunction<T> =>
	async (
			command: APICommand<SelectFromListFlags>,
			itemIdOrNameFromArg?: string,
			options?: Partial<ChooseOptions<T>>,
	): Promise<string> => {
		const opts = chooseOptionsWithDefaults(options)

		// Listing items usually makes an API call which we only want to happen once so we do it
		// now and just use stub functions that return these items later as needed.
		const items = await (opts.listItems ?? listItems)(command)
		const filteredItems = opts.listFilter ? items.filter(opts.listFilter) : items
		const listItemsWrapper = async (): Promise<T[]> => filteredItems

		const preselectedId = opts.allowIndex
			? await stringTranslateToId(config, itemIdOrNameFromArg, listItemsWrapper)
			: itemIdOrNameFromArg

		const selectOptions: SelectOptions<T> = {
			preselectedId,
			autoChoose: opts.autoChoose,
			listItems: listItemsWrapper,
			promptMessage: opts.promptMessage,
			customNotFoundMessage: createOptions?.customNotFoundMessage,
		}

		if (opts.useConfigDefault) {
			const defaultValue = createOptions?.defaultValue
			if (!defaultValue) {
				throw Error('invalid state, the choose<Thing> function was called with "useConfigDefault"' +
					' but no default configured')
			}
			selectOptions.defaultValue = {
				...defaultValue,
				getItem: (id: string): Promise<T> => defaultValue.getItem(command, id),
			}
		}

		return selectFromList(
			command,
			config,
			selectOptions,
		)
	}
