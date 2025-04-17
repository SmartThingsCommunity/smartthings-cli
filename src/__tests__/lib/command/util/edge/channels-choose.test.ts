import { jest } from '@jest/globals'

import { ChannelsEndpoint, type Channel } from '@smartthings/core-sdk'

import type { APICommand } from '../../../../../lib/command/api-command.js'
import type { stringTranslateToId } from '../../../../../lib/command/command-util.js'
import type { ListDataFunction } from '../../../../../lib/command/io-defs.js'
import type { selectFromList } from '../../../../../lib/command/select.js'
import type { chooseOptionsWithDefaults } from '../../../../../lib/command/util/util-util.js'
import type { listChannels } from '../../../../../lib/command/util/edge/channels.js'
import type { ChannelChoice, ChooseChannelOptions } from '../../../../../lib/command/util/edge/channels-choose.js'


const stringTranslateToIdMock = jest.fn<typeof stringTranslateToId>()
jest.unstable_mockModule('../../../../../lib/command/command-util.js', () => ({
	stringTranslateToId: stringTranslateToIdMock,
}))

const selectFromListMock = jest.fn<typeof selectFromList>().mockResolvedValue('chosen-channel-id')
jest.unstable_mockModule('../../../../../lib/command/select.js', () => ({
	selectFromList: selectFromListMock,
}))

const chooseOptionsWithDefaultsMock = jest.fn<typeof chooseOptionsWithDefaults<ChannelChoice>>()
jest.unstable_mockModule('../../../../../lib/command/util/util-util.js', () => ({
	chooseOptionsWithDefaults: chooseOptionsWithDefaultsMock,
}))

const listChannelsMock = jest.fn<typeof listChannels>()
jest.unstable_mockModule('../../../../../lib/command/util/edge/channels.js', () => ({
	listChannels: listChannelsMock,
}))


const {
	chooseChannelOptionsWithDefaults,
	chooseChannel,
} = await import('../../../../../lib/command/util/edge/channels-choose.js')

describe('chooseChannelOptionsWithDefaults', () => {
	it('has a reasonable default', () => {
		chooseOptionsWithDefaultsMock.mockReturnValue({} as ChooseChannelOptions)

		expect(chooseChannelOptionsWithDefaults())
			.toEqual(expect.objectContaining({ includeReadOnly: false }))

		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledExactlyOnceWith(undefined)
	})

	it('accepts true value', () => {
		chooseOptionsWithDefaultsMock.mockReturnValue({ includeReadOnly: true } as ChooseChannelOptions)

		expect(chooseChannelOptionsWithDefaults({ includeReadOnly: true }))
			.toEqual(expect.objectContaining({ includeReadOnly: true }))

		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledExactlyOnceWith({ includeReadOnly: true })
	})
})

describe('chooseChannel', () => {
	const channel = { channelId: 'channel-id', name: 'channel name' } as Channel

	const apiChannelsGetMock = jest.fn<typeof ChannelsEndpoint.prototype.get>()
	const client = {
		channels: {
			get: apiChannelsGetMock,
		},
	}

	const command = { client } as unknown as APICommand

	it('uses default channel if specified', async () => {
		chooseOptionsWithDefaultsMock.mockReturnValueOnce(
			{ allowIndex: false, useConfigDefault: true } as ChooseChannelOptions)

		expect(await chooseChannel(command, 'prompt message', undefined, { useConfigDefault: true }))
			.toBe('chosen-channel-id')

		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledExactlyOnceWith({ useConfigDefault: true })
		expect(selectFromListMock).toHaveBeenCalledExactlyOnceWith(command,
			expect.objectContaining({ primaryKeyName: 'channelId', sortKeyName: 'name' }),
			expect.objectContaining({
				defaultValue: {
					configKey: 'defaultChannel',
					getItem: expect.any(Function),
					userMessage: expect.any(Function),
				},
				promptMessage: 'prompt message',
			}))

		expect(stringTranslateToIdMock).not.toHaveBeenCalled()
	})

	it('translates id from index if allowed', async () => {
		chooseOptionsWithDefaultsMock.mockReturnValueOnce(
			{ allowIndex: true } as ChooseChannelOptions)
		stringTranslateToIdMock.mockResolvedValueOnce('translated-id')

		expect(await chooseChannel(command, 'prompt message', 'command-line-channel-id',
			{ allowIndex: true })).toBe('chosen-channel-id')

		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledExactlyOnceWith({ allowIndex: true })
		expect(stringTranslateToIdMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ primaryKeyName: 'channelId', sortKeyName: 'name' }),
			'command-line-channel-id', expect.any(Function))
		expect(selectFromListMock).toHaveBeenCalledExactlyOnceWith(command,
			expect.objectContaining({ primaryKeyName: 'channelId', sortKeyName: 'name' }),
			expect.objectContaining({ preselectedId: 'translated-id' }))
	})

	it('uses listItems from options', async () => {
		const listItemsMock = jest.fn<ListDataFunction<ChannelChoice>>()

		chooseOptionsWithDefaultsMock.mockReturnValueOnce({} as ChooseChannelOptions)

		expect(await chooseChannel(
			command,
			'prompt message',
			'command-line-channel-id',
			{ listItems: listItemsMock },
		)).toBe('chosen-channel-id')

		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledExactlyOnceWith({ listItems: listItemsMock })
		expect(selectFromListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ primaryKeyName: 'channelId', sortKeyName: 'name' }),
			expect.objectContaining({ listItems: expect.any(Function) }),
		)

		const listItems = selectFromListMock.mock.calls[0][2].listItems
		const channels = [channel]
		listItemsMock.mockResolvedValueOnce(channels)

		expect(await listItems()).toBe(channels)

		expect(listItemsMock).toHaveBeenCalledExactlyOnceWith(command)
	})

	it('defaults to listChannels for listing channels', async () => {
		chooseOptionsWithDefaultsMock.mockReturnValueOnce(
			{ allowIndex: false, includeReadOnly: false } as ChooseChannelOptions)

		expect(await chooseChannel(command, 'prompt message', 'command-line-channel-id'))
			.toBe('chosen-channel-id')

		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledExactlyOnceWith(undefined)
		expect(selectFromListMock).toHaveBeenCalledExactlyOnceWith(command,
			expect.objectContaining({ primaryKeyName: 'channelId', sortKeyName: 'name' }),
			expect.objectContaining({ preselectedId: 'command-line-channel-id' }))

		expect(stringTranslateToIdMock).not.toHaveBeenCalled()

		const listItems = selectFromListMock.mock.calls[0][2].listItems

		const list = [{ name: 'Channel' }] as Channel[]
		listChannelsMock.mockResolvedValueOnce(list)

		expect(await listItems()).toBe(list)

		expect(listChannelsMock).toHaveBeenCalledExactlyOnceWith(client, { includeReadOnly: false })
	})

	it('requests read-only channels when needed', async () => {
		chooseOptionsWithDefaultsMock.mockReturnValueOnce(
			{ allowIndex: false, includeReadOnly: true } as ChooseChannelOptions)

		expect(await chooseChannel(command, 'prompt message', 'command-line-channel-id'))
			.toBe('chosen-channel-id')

		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledTimes(1)
		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledWith(undefined)
		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(command,
			expect.objectContaining({ primaryKeyName: 'channelId', sortKeyName: 'name' }),
			expect.objectContaining({ preselectedId: 'command-line-channel-id' }))

		expect(stringTranslateToIdMock).not.toHaveBeenCalled()

		const listItems = selectFromListMock.mock.calls[0][2].listItems

		const list = [{ name: 'Channel' }] as Channel[]
		listChannelsMock.mockResolvedValueOnce(list)

		expect(await listItems()).toBe(list)

		expect(listChannelsMock).toHaveBeenCalledTimes(1)
		expect(listChannelsMock).toHaveBeenCalledWith(client, { includeReadOnly: true })
	})

	describe('defaultConfig', () => {
		test('getItem uses channels.get', async () => {
			chooseOptionsWithDefaultsMock.mockReturnValueOnce(
				{ allowIndex: false, useConfigDefault: true } as ChooseChannelOptions)

			expect(await chooseChannel(command, 'prompt message', undefined,
				{ useConfigDefault: true })).toBe('chosen-channel-id')

			const defaultValue = selectFromListMock.mock.calls[0][2].defaultValue

			expect(defaultValue).toBeDefined()
			const getItem = defaultValue?.getItem as (id: string) => Promise<Channel>
			expect(getItem).toBeDefined()
			apiChannelsGetMock.mockResolvedValueOnce(channel)

			expect(await getItem('id-to-check')).toBe(channel)

			expect(apiChannelsGetMock).toHaveBeenCalledTimes(1)
			expect(apiChannelsGetMock).toHaveBeenCalledWith('id-to-check')
		})

		test('userMessage returns expected message', async () => {
			chooseOptionsWithDefaultsMock.mockReturnValueOnce(
				{ allowIndex: false, useConfigDefault: true } as ChooseChannelOptions)

			expect(await chooseChannel(command, 'prompt message', undefined,
				{ useConfigDefault: true })).toBe('chosen-channel-id')

			const defaultValue = selectFromListMock.mock.calls[0][2].defaultValue

			expect(defaultValue).toBeDefined()
			const userMessage = defaultValue?.userMessage as (channel: Channel) => string
			expect(userMessage).toBeDefined()

			expect(userMessage(channel))
				.toBe('using previously specified default channel named "channel name" (channel-id)')
		})
	})
})
