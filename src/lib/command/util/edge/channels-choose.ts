import { type Channel, type EnrolledChannel } from '@smartthings/core-sdk'

import { type APICommand } from '../../api-command.js'
import { stringTranslateToId } from '../../command-util.js'
import { selectFromList, type SelectFromListConfig } from '../../select.js'
import { ChooseOptions, chooseOptionsWithDefaults } from '../util-util.js'
import { listChannels } from './channels.js'


/**
 * Both Channel and Enrolled channel have all the fields necessary for choosing a channel. Using
 * this allows callers of `chooseChannel` to supply a `listItems` that returns a list of either.
 */
export type ChannelChoice = Channel | EnrolledChannel

export type ChooseChannelOptions = ChooseOptions<ChannelChoice> & {
	includeReadOnly: boolean
}

export const chooseChannelOptionsWithDefaults = (options?: Partial<ChooseChannelOptions>): ChooseChannelOptions => ({
	includeReadOnly: false,
	...chooseOptionsWithDefaults(options),
})

export async function chooseChannel(command: APICommand, promptMessage: string,
		channelFromArg?: string,
		options?: Partial<ChooseChannelOptions>): Promise<string> {
	const opts = chooseChannelOptionsWithDefaults(options)
	const config: SelectFromListConfig<ChannelChoice> = {
		itemName: 'channel',
		primaryKeyName: 'channelId',
		sortKeyName: 'name',
	}

	const listItems = (): Promise<ChannelChoice[]> => options?.listItems
		? options.listItems(command)
		: listChannels(command.client, { includeReadOnly: opts.includeReadOnly })

	const preselectedId = channelFromArg
		? (opts.allowIndex
			? await stringTranslateToId(config, channelFromArg, listItems)
			: channelFromArg)
		: undefined

	const defaultValue = opts.useConfigDefault
		? {
			configKey: 'defaultChannel',
			getItem: (id: string): Promise<ChannelChoice> => command.client.channels.get(id),
			userMessage: (channel: ChannelChoice): string =>
				`using previously specified default channel named "${channel.name}" (${channel.channelId})`,
		}
		: undefined
	return selectFromList(
		command,
		config,
		{ preselectedId, listItems, promptMessage, defaultValue },
	)
}
