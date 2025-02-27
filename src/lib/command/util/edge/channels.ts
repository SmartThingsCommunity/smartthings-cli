import { type Channel, type SmartThingsClient, type SubscriberType } from '@smartthings/core-sdk'

import { forAllOrganizations, WithOrganization } from '../../../api-helpers.js'
import { fatalError } from '../../../util.js'


export type ListChannelOptions = {
	allOrganizations: boolean
	includeReadOnly: boolean
	subscriberType?: SubscriberType
	subscriberId?: string
}
export const listChannels = async (
		client: SmartThingsClient,
		options?: Partial<ListChannelOptions>,
): Promise<(Channel & WithOrganization)[]> => {
	const includeReadOnly = options?.includeReadOnly
	const subscriberType = options?.subscriberType
	const subscriberId = options?.subscriberId
	if (options?.allOrganizations) {
		if (includeReadOnly) {
			return fatalError('--includeReadOnly (-I) and --allOrganizations (-A) options are incompatible')
		}
		return forAllOrganizations(client, orgClient => orgClient.channels.list({ subscriberType, subscriberId }))
	}
	return client.channels.list({ includeReadOnly, subscriberType, subscriberId })
}

export type WithChannel = {
	channelId: string
}

export type WithNamedChannel = WithChannel & {
	channelName?: string
}

export async function withChannelNames<T extends WithChannel>(
	client: SmartThingsClient, input: T,
): Promise<T & WithNamedChannel>
export async function withChannelNames<T extends WithChannel>(
	client: SmartThingsClient, input: T[],
): Promise<(T & WithNamedChannel)[]>
export async function withChannelNames<T extends WithChannel>(
		client: SmartThingsClient, input: T | T[],
): Promise<(T & WithNamedChannel) | (T & WithNamedChannel)[]> {
	if (Array.isArray(input)) {
		const channels = await listChannels(client, { includeReadOnly: true })
		const channelNamesById = new Map(channels.map(channel => [channel.channelId, channel.name]))

		for (const inputItem of input) {
			if (!channelNamesById.get(inputItem.channelId)) {
				const channelName = (await client.channels.get(inputItem.channelId)).name
				channelNamesById.set(inputItem.channelId, channelName)
			}
		}

		return input.map(input => ({ ...input, channelName: channelNamesById.get(input.channelId) }))
	}

	const channel = await client.channels.get(input.channelId)
	return { ...input, channelName: channel.name }
}
