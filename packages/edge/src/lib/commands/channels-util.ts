import { Channel, SmartThingsClient, SubscriberType } from '@smartthings/core-sdk'

import {
	APICommand,
	ChooseOptions,
	chooseOptionsWithDefaults,
	forAllOrganizations,
	selectFromList,
	SelectFromListConfig,
	stringTranslateToId,
} from '@smartthings/cli-lib'


export const listTableFieldDefinitions = ['channelId', 'name', 'description', 'termsOfServiceUrl',
	'createdDate', 'lastModifiedDate']

export const tableFieldDefinitions = listTableFieldDefinitions

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

	const configKeyForDefaultValue = opts.useConfigDefault ? 'defaultChannel' : undefined
	return selectFromList(command, config,
		{ preselectedId, listItems, promptMessage, configKeyForDefaultValue })
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
