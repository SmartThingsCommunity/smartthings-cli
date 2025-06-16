import { type Channel } from '@smartthings/core-sdk'

import { type APICommand } from '../../api-command.js'
import { type ChooseFunction, createChooseFn } from '../util-util.js'
import { listChannels } from './channels.js'


/**
 * Using this allows callers of `chooseChannel` to supply a `listItems` that returns a list of anything
 * that has both the channelId and name fields.
 */
export type ChannelChoice = Pick<Channel, 'channelId' | 'name'>

export type ChooseChannelOptions = {
	includeReadOnly?: boolean

	/**
	 * Include only channels that have the specified driver id assigned to them.
	 */
	withDriverId?: string
}

export const chooseChannelFn = (options?: ChooseChannelOptions): ChooseFunction<ChannelChoice> => {
	const listItems = async (command: APICommand): Promise<(ChannelChoice)[]> => {
		const allChannels = await listChannels(command.client, { includeReadOnly: !!options?.includeReadOnly })
		if (options?.withDriverId) {
			const filteredChannels: ChannelChoice[] = []
			await Promise.all(allChannels.map(async channel => {
				const assignedDrivers = await command.client.channels.listAssignedDrivers(channel.channelId)
				if (assignedDrivers.find(assignedDriver => assignedDriver.driverId === options.withDriverId)) {
					filteredChannels.push(channel)
				}
			}))
			return filteredChannels
		}
		return allChannels
	}

	const defaultValue = {
		configKey: 'defaultChannel',
		getItem: (command: APICommand, id: string): Promise<ChannelChoice> => command.client.channels.get(id),
		userMessage: (channel: ChannelChoice): string =>
			`using previously specified default channel named "${channel.name}" (${channel.channelId})`,
	}
	return createChooseFn(
		{ itemName: 'channel', primaryKeyName: 'channelId', sortKeyName: 'name' },
		listItems,
		{ defaultValue },
	)
}

export const chooseChannel = chooseChannelFn()
