import { Channel, SmartThingsClient, SubscriberType } from '@smartthings/core-sdk'

import {
	APICommand,
	ChooseOptions,
	chooseOptionsWithDefaults,
	forAllOrganizations,
	selectFromList,
	SelectFromListConfig,
	stringTranslateToId,
	TableFieldDefinition,
} from '@smartthings/cli-lib'


export const listTableFieldDefinitions: TableFieldDefinition<Channel>[] =
	['channelId', 'name', 'createdDate', 'lastModifiedDate']

export const tableFieldDefinitions: TableFieldDefinition<Channel>[] =
	['channelId', 'name', 'description', 'termsOfServiceUrl', 'createdDate', 'lastModifiedDate']

export interface ChooseChannelOptions extends ChooseOptions {
	includeReadOnly: boolean
}

export const chooseChannelOptionsWithDefaults = (options?: Partial<ChooseChannelOptions>): ChooseChannelOptions => ({
	includeReadOnly: false,
	...chooseOptionsWithDefaults(options),
})

export async function chooseChannel(command: APICommand<typeof APICommand.flags>, promptMessage: string,
		channelFromArg?: string,
		options?: Partial<ChooseChannelOptions>): Promise<string> {
	const opts = chooseChannelOptionsWithDefaults(options)
	const config: SelectFromListConfig<Channel> = {
		itemName: 'channel',
		primaryKeyName: 'channelId',
		sortKeyName: 'name',
	}

	const listItems = (): Promise<Channel[]> => listChannels(command.client, { includeReadOnly: opts.includeReadOnly })

	const preselectedId = channelFromArg
		? (opts.allowIndex
			? await stringTranslateToId(config, channelFromArg, listItems)
			: channelFromArg)
		: undefined

	const defaultValue = opts.useConfigDefault
		? {
			configKey: 'defaultChannel',
			getItem: (id: string): Promise<Channel> => command.client.channels.get(id),
			userMessage: (channel: Channel): string => `using previously specified default channel named "${channel.name}" (${channel.channelId})`,
		}
		: undefined
	return selectFromList(command, config,
		{ preselectedId, listItems, promptMessage, defaultValue })
}

export interface ListChannelOptions {
	allOrganizations: boolean
	includeReadOnly: boolean
	subscriberType?: SubscriberType
	subscriberId?: string
}
export async function listChannels(client: SmartThingsClient, options?: Partial<ListChannelOptions>): Promise<Channel[]> {
	const includeReadOnly = options?.includeReadOnly
	const subscriberType = options?.subscriberType
	const subscriberId = options?.subscriberId
	if (options?.allOrganizations) {
		if (includeReadOnly) {
			throw Error('includeReadOnly and allOrganizations options are incompatible')
		}
		return await forAllOrganizations(client, orgClient => orgClient.channels.list({ subscriberType, subscriberId }))
	}
	return client.channels.list({ includeReadOnly, subscriberType, subscriberId })
}

export interface WithChannel {
	channelId: string
}

export interface WithNamedChannel extends WithChannel {
	channelName?: string
}

export async function withChannelNames<T extends WithChannel>(client: SmartThingsClient, input: T): Promise<T & WithNamedChannel>
export async function withChannelNames<T extends WithChannel>(client: SmartThingsClient, input: T[]): Promise<(T & WithNamedChannel)[]>
export async function withChannelNames<T extends WithChannel>(client: SmartThingsClient, input: T | T[]): Promise<(T & WithNamedChannel) | (T & WithNamedChannel)[]> {
	if (Array.isArray(input)) {
		const channels = await listChannels(client, { includeReadOnly: true })
		const channelNamesById = new Map(channels.map(channel => [channel.channelId, channel.name]))
		return input.map(input => ({ ...input, channelName: channelNamesById.get(input.channelId) }))
	}

	const channel = await client.channels.get(input.channelId)
	return { ...input, channelName: channel.name }
}
