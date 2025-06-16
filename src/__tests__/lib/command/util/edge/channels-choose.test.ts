import { jest } from '@jest/globals'

import type { ChannelsEndpoint, Channel, DriverChannelDetails } from '@smartthings/core-sdk'

import type { APICommand } from '../../../../../lib/command/api-command.js'
import type { ChooseFunction, createChooseFn } from '../../../../../lib/command/util/util-util.js'
import type { listChannels } from '../../../../../lib/command/util/edge/channels.js'
import type { ChannelChoice } from '../../../../../lib/command/util/edge/channels-choose.js'


const createChooseFnMock = jest.fn<typeof createChooseFn<ChannelChoice>>()
jest.unstable_mockModule('../../../../../lib/command/util/util-util.js', () => ({
	createChooseFn: createChooseFnMock,
}))

const listChannelsMock = jest.fn<typeof listChannels>()
jest.unstable_mockModule('../../../../../lib/command/util/edge/channels.js', () => ({
	listChannels: listChannelsMock,
}))


const {
	chooseChannelFn,
} = await import('../../../../../lib/command/util/edge/channels-choose.js')

describe('chooseChannelFn', () => {
	const chooseChannelMock = jest.fn<ChooseFunction<ChannelChoice>>()
	createChooseFnMock.mockReturnValue(chooseChannelMock)

	const channel1 = { channelId: 'channel-id-1', name: 'Channel Uno' } as Channel
	const channel2 = { channelId: 'channel-id-2', name: 'Channel Dos' } as Channel
	const channels = [channel1, channel2]
	listChannelsMock.mockResolvedValue(channels)

	const apiChannelsGetMock = jest.fn<typeof ChannelsEndpoint.prototype.get>().mockResolvedValue(channel1)
	const apiChannelsListAssignedDriversMock = jest.fn<typeof ChannelsEndpoint.prototype.listAssignedDrivers>()
	const client = {
		channels: {
			get: apiChannelsGetMock,
			listAssignedDrivers: apiChannelsListAssignedDriversMock,
		},
	}

	const command = { client } as unknown as APICommand

	it('uses listChannels to get channels', async () => {
		expect(chooseChannelFn()).toBe(chooseChannelMock)

		expect(createChooseFnMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ itemName: 'channel' }),
			expect.any(Function),
			{ defaultValue: expect.objectContaining({ configKey: 'defaultChannel' }) },
		)

		const listItems = createChooseFnMock.mock.calls[0][1]

		expect(await listItems(command)).toBe(channels)

		expect(listChannelsMock).toHaveBeenCalledExactlyOnceWith(command.client, { includeReadOnly: false })
	})

	it('includes read-only drivers when requested', async () => {
		expect(chooseChannelFn({ includeReadOnly: true })).toBe(chooseChannelMock)

		const listItems = createChooseFnMock.mock.calls[0][1]

		expect(await listItems(command)).toBe(channels)

		expect(listChannelsMock).toHaveBeenCalledExactlyOnceWith(command.client, { includeReadOnly: true })
	})

	it('filters out channels not assigned to specified driver id', async () => {
		expect(chooseChannelFn({ withDriverId: 'pre-chosen-driver-id' })).toBe(chooseChannelMock)

		const listItems = createChooseFnMock.mock.calls[0][1]

		apiChannelsListAssignedDriversMock.mockResolvedValueOnce([{ driverId: 'not-the-chosen-one' } as DriverChannelDetails])
		apiChannelsListAssignedDriversMock.mockResolvedValueOnce([
			{ driverId: 'also-not-chosen' },
			{ driverId: 'pre-chosen-driver-id' },
		] as DriverChannelDetails[])
		expect(await listItems(command)).toStrictEqual([channel2])

		expect(listChannelsMock).toHaveBeenCalledExactlyOnceWith(command.client, { includeReadOnly: false })
	})

	it('uses default channel', async () => {
		expect(chooseChannelFn()).toBe(chooseChannelMock)

		expect(createChooseFnMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ itemName: 'channel' }),
			expect.any(Function),
			{
				defaultValue: {
					configKey: 'defaultChannel',
					getItem: expect.any(Function),
					userMessage: expect.any(Function),
				},
			},
		)

		const defaultValue = createChooseFnMock.mock.calls[0][2]?.defaultValue

		expect(await defaultValue?.getItem(command, 'channel-id')).toBe(channel1)
		expect(apiChannelsGetMock).toHaveBeenCalledExactlyOnceWith('channel-id')

		expect(defaultValue?.userMessage(channel1))
			.toBe('using previously specified default channel named "Channel Uno" (channel-id-1)')
	})
})
