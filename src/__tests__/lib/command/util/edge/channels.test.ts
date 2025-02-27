import { jest } from '@jest/globals'

import { Channel, ChannelsEndpoint, OrganizationResponse, SmartThingsClient } from '@smartthings/core-sdk'

import type { forAllOrganizations } from '../../../../../lib/api-helpers.js'
import type { fatalError } from '../../../../../lib/util.js'


const forAllOrganizationsMock = jest.fn<typeof forAllOrganizations>()
jest.unstable_mockModule('../../../../../lib/api-helpers.js', () => ({
	forAllOrganizations: forAllOrganizationsMock,
}))

const fatalErrorMock = jest.fn<typeof fatalError>().mockImplementation(() => { throw Error('fatal error') })
jest.unstable_mockModule('../../../../../lib/util.js', () => ({
	fatalError: fatalErrorMock,
}))


const { listChannels, withChannelNames } = await import('../../../../../lib/command/util/edge/channels.js')


const apiChannelsGetMock = jest.fn<typeof ChannelsEndpoint.prototype.get>()
const apiChannelsListMock = jest.fn<typeof ChannelsEndpoint.prototype.list>()
const client = {
	channels: {
		get: apiChannelsGetMock,
		list: apiChannelsListMock,
	},
} as unknown as SmartThingsClient

describe('listChannels', () => {
	const result = [
		{
			'channelId': 'channel-id',
			'name': 'Channel Name',
		},
	] as Channel[]
	apiChannelsListMock.mockResolvedValue(result)

	it('lists channels', async () => {
		expect(await listChannels(client)).toBe(result)

		expect(apiChannelsListMock).toHaveBeenCalledTimes(1)
		expect(apiChannelsListMock).toHaveBeenCalledWith(expect.not.objectContaining({ includeReadOnly: true }))
	})

	it('lists channels including read-only', async () => {
		expect(await listChannels(client, { allOrganizations: false, includeReadOnly: true })).toBe(result)

		expect(apiChannelsListMock).toHaveBeenCalledTimes(1)
		expect(apiChannelsListMock).toHaveBeenCalledWith({ includeReadOnly: true })
	})

	it('passes subscriber filters on', async () => {
		expect(await listChannels(
			client,
			{ subscriberType: 'HUB', subscriberId: 'subscriber-id', allOrganizations: false, includeReadOnly: false },
		)).toBe(result)

		expect(apiChannelsListMock).toHaveBeenCalledTimes(1)
		expect(apiChannelsListMock).toHaveBeenCalledWith({
			includeReadOnly: false, subscriberType: 'HUB', subscriberId: 'subscriber-id',
		})
	})

	it('lists channels in all organizations', async () => {
		const expected = [
			{ ...result[0], organization: 'Organization One' },
			{ ...result[0], organization: 'Organization Two' },
		]
		forAllOrganizationsMock.mockResolvedValueOnce(expected)

		expect(await listChannels(client, { allOrganizations: true, includeReadOnly: false })).toStrictEqual(expected)

		expect(forAllOrganizationsMock).toHaveBeenCalledTimes(1)
		expect(forAllOrganizationsMock).toHaveBeenCalledWith(client, expect.any(Function))
		expect(apiChannelsListMock).toHaveBeenCalledTimes(0)

		const listChannelsFunction = forAllOrganizationsMock.mock.calls[0][1]

		expect(await listChannelsFunction(client, { organizationId: 'unused' } as OrganizationResponse)).toBe(result)
	})

	it('throws error when both allOrganizations and includeReadOnly included', async () => {
		await expect(listChannels(client, { allOrganizations: true, includeReadOnly: true }))
			.rejects.toThrow('fatal error')

		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith(
			'--includeReadOnly (-I) and --allOrganizations (-A) options are incompatible',
		)
	})
})

describe('withChannelNames', () => {
	const thingWithChannel1 = { channelId: 'channel-id-1' }
	const channel1 = { channelId: 'channel-id-1', name: 'Channel 1' } as Channel
	const thingWithChannel2 = { channelId: 'channel-id-2' }
	const channel2 = { channelId: 'channel-id-2', name: 'Channel 2' } as Channel

	it('adds channel name to single item', async () => {
		apiChannelsGetMock.mockResolvedValueOnce(channel1)

		expect(await withChannelNames(client, thingWithChannel1)).toStrictEqual(
			{ channelId: 'channel-id-1', channelName: 'Channel 1' },
		)

		expect(apiChannelsListMock).toHaveBeenCalledTimes(0)
		expect(apiChannelsGetMock).toHaveBeenCalledTimes(1)
		expect(apiChannelsGetMock).toHaveBeenCalledWith('channel-id-1')
	})

	it('adds channel name to multiple items', async () => {
		apiChannelsListMock.mockResolvedValueOnce([channel1, channel2])

		expect(await withChannelNames(client, [thingWithChannel1, thingWithChannel2])).toStrictEqual([
			{ channelId: 'channel-id-1', channelName: 'Channel 1' },
			{ channelId: 'channel-id-2', channelName: 'Channel 2' },
		])

		expect(apiChannelsListMock).toHaveBeenCalledTimes(1)
		expect(apiChannelsListMock).toHaveBeenCalledWith(expect.objectContaining({ includeReadOnly: true }))
		expect(apiChannelsGetMock).toHaveBeenCalledTimes(0)
	})

	it('looks up and adds channel name when missing from list', async () => {
		apiChannelsListMock.mockResolvedValueOnce([channel1])
		apiChannelsGetMock.mockResolvedValueOnce(channel2)

		expect(await withChannelNames(client, [thingWithChannel1, thingWithChannel2])).toStrictEqual([
			{ channelId: 'channel-id-1', channelName: 'Channel 1' },
			{ channelId: 'channel-id-2', channelName: 'Channel 2' },
		])

		expect(apiChannelsListMock).toHaveBeenCalledTimes(1)
		expect(apiChannelsListMock).toHaveBeenCalledWith(expect.objectContaining({ includeReadOnly: true }))
		expect(apiChannelsGetMock).toHaveBeenCalledTimes(1)
		expect(apiChannelsGetMock).toHaveBeenCalledWith('channel-id-2')
	})
})
