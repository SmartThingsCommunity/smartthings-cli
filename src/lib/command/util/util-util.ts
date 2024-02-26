import { SmartThingsClient } from '@smartthings/core-sdk'

import { APICommand } from '../api-command.js'
import { ChooseOptions, chooseOptionsWithDefaults, stringTranslateToId } from '../command-util.js'
import { SelectFromListConfig, SelectFromListFlags, selectFromList } from '../select.js'


export type ChooseFunction<T extends object> = (
	command: APICommand<SelectFromListFlags>,
	locationFromArg?: string,
	options?: Partial<ChooseOptions<T>>) => Promise<string>

export const createChooseFn = <T extends object>(
	config: SelectFromListConfig<T>,
	listItems: (client: SmartThingsClient) => Promise<T[]>,
): ChooseFunction<T> =>
	async (
			command: APICommand<SelectFromListFlags>,
			locationFromArg?: string,
			options?: Partial<ChooseOptions<T>>): Promise<string> => {
		const opts = chooseOptionsWithDefaults(options)

		const listItemsWrapper = (): Promise<T[]> => listItems(command.client)

		const preselectedId = opts.allowIndex
			? await stringTranslateToId(config, locationFromArg, listItemsWrapper)
			: locationFromArg

		return selectFromList(command, config, {
			preselectedId,
			autoChoose: opts.autoChoose,
			listItems: listItemsWrapper,
		})
	}
