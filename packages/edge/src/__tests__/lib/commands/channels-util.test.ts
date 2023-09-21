import { Channel, OrganizationResponse, SmartThingsClient } from '@smartthings/core-sdk'

import { APICommand, chooseOptionsWithDefaults, forAllOrganizations, selectFromList,
	stringTranslateToId } from '@smartthings/cli-lib'

import { chooseChannel, listChannels, ChooseChannelOptions, chooseChannelOptionsWithDefaults, withChannelNames }
	from '../../../lib/commands/channels-util.js'
import * as channelsUtil from '../../../lib/commands/channels-util.js'


jest.mock('@smartthings/cli-lib', () => ({
	...jest.requireActual('@smartthings/cli-lib'),
	chooseOptionsWithDefaults: jest.fn(),
	stringTranslateToId: jest.fn(),
	selectFromList: jest.fn(),
	forAllOrganizations: jest.fn(),
}))


describe('channels-util', () => {
	describe('chooseChannelOptionsWithDefaults', () => {
		const chooseOptionsWithDefaultsMock = jest.mocked(chooseOptionsWithDefaults)

		it('has a reasonable default', () => {
			chooseOptionsWithDefaultsMock.mockReturnValue({} as ChooseChannelOptions)

			expect(chooseChannelOptionsWithDefaults())
				.toEqual(expect.objectContaining({ includeReadOnly: false }))

			expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledTimes(1)
			expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledWith(undefined)
		})

		it('accepts true value', () => {
			chooseOptionsWithDefaultsMock.mockReturnValue({ includeReadOnly: true } as ChooseChannelOptions)

			expect(chooseChannelOptionsWithDefaults({ includeReadOnly: true }))
				.toEqual(expect.objectContaining({ includeReadOnly: true }))

			expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledTimes(1)
			expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledWith({ includeReadOnly: true })
		})
	})

	describe('chooseChannel', () => {
		const channel = { channelId: 'channel-id', name: 'channel name' } as Channel

		const selectFromListMock = jest.mocked(selectFromList)

		const listChannelsMock = jest.fn()
		const getChannelsMock = jest.fn()
		const client = { channels: { list: listChannelsMock, get: getChannelsMock } }
		// eslint-disable-next-line @typescript-eslint/naming-convention
		const flags = { 'all-organizations': false, 'include-read-only': false }
		const command = { client, flags } as unknown as APICommand<typeof APICommand.flags>

		const chooseChannelOptionsWithDefaultsSpy = jest.spyOn(channelsUtil, 'chooseChannelOptionsWithDefaults')
		const stringTranslateToIdMock = jest.mocked(stringTranslateToId)

		it('uses default channel if specified', async () => {
			chooseChannelOptionsWithDefaultsSpy.mockReturnValueOnce(
				{ allowIndex: false, useConfigDefault: true } as ChooseChannelOptions)
			selectFromListMock.mockImplementation(async () => 'chosen-channel-id')

			expect(await chooseChannel(command, 'prompt message', undefined, { useConfigDefault: true }))
				.toBe('chosen-channel-id')

			expect(chooseChannelOptionsWithDefaultsSpy).toHaveBeenCalledTimes(1)
			expect(chooseChannelOptionsWithDefaultsSpy).toHaveBeenCalledWith({ useConfigDefault: true })
			expect(stringTranslateToIdMock).toHaveBeenCalledTimes(0)
			expect(selectFromListMock).toHaveBeenCalledTimes(1)
			expect(selectFromListMock).toHaveBeenCalledWith(command,
				expect.objectContaining({ primaryKeyName: 'channelId', sortKeyName: 'name' }),
				expect.objectContaining({
					defaultValue: { configKey: 'defaultChannel', getItem: expect.any(Function), userMessage: expect.any(Function) },
					promptMessage: 'prompt message',
				}))
		})

		it('translates id from index if allowed', async () => {
			chooseChannelOptionsWithDefaultsSpy.mockReturnValueOnce(
				{ allowIndex: true } as ChooseChannelOptions)
			stringTranslateToIdMock.mockResolvedValueOnce('translated-id')
			selectFromListMock.mockImplementation(async () => 'chosen-channel-id')

			expect(await chooseChannel(command, 'prompt message', 'command-line-channel-id',
				{ allowIndex: true })).toBe('chosen-channel-id')

			expect(chooseChannelOptionsWithDefaultsSpy).toHaveBeenCalledTimes(1)
			expect(chooseChannelOptionsWithDefaultsSpy).toHaveBeenCalledWith({ allowIndex: true })
			expect(stringTranslateToIdMock).toHaveBeenCalledTimes(1)
			expect(stringTranslateToIdMock).toHaveBeenCalledWith(
				expect.objectContaining({ primaryKeyName: 'channelId', sortKeyName: 'name' }),
				'command-line-channel-id', expect.any(Function))
			expect(selectFromListMock).toHaveBeenCalledTimes(1)
			expect(selectFromListMock).toHaveBeenCalledWith(command,
				expect.objectContaining({ primaryKeyName: 'channelId', sortKeyName: 'name' }),
				expect.objectContaining({ preselectedId: 'translated-id' }))
		})

		it('uses listItems from options', async () => {
			const listItemsMock = jest.fn()

			chooseChannelOptionsWithDefaultsSpy.mockReturnValueOnce({} as ChooseChannelOptions)
			selectFromListMock.mockImplementation(async () => 'chosen-channel-id')

			expect(await chooseChannel(command, 'prompt message', 'command-line-channel-id',
				{ listItems: listItemsMock })).toBe('chosen-channel-id')

			expect(chooseChannelOptionsWithDefaultsSpy).toHaveBeenCalledTimes(1)
			expect(chooseChannelOptionsWithDefaultsSpy).toHaveBeenCalledWith({ listItems: listItemsMock })
			expect(selectFromListMock).toHaveBeenCalledTimes(1)
			expect(selectFromListMock).toHaveBeenCalledWith(command,
				expect.objectContaining({ primaryKeyName: 'channelId', sortKeyName: 'name' }),
				expect.objectContaining({ listItems: listItemsMock }))
		})

		it('uses list function that lists channels', async () => {
			chooseChannelOptionsWithDefaultsSpy.mockReturnValueOnce(
				{ allowIndex: false, includeReadOnly: false } as ChooseChannelOptions)
			selectFromListMock.mockImplementation(async () => 'chosen-channel-id')

			expect(await chooseChannel(command, 'prompt message', 'command-line-channel-id'))
				.toBe('chosen-channel-id')

			expect(chooseChannelOptionsWithDefaultsSpy).toHaveBeenCalledTimes(1)
			expect(chooseChannelOptionsWithDefaultsSpy).toHaveBeenCalledWith(undefined)
			expect(stringTranslateToIdMock).toHaveBeenCalledTimes(0)
			expect(selectFromListMock).toHaveBeenCalledTimes(1)
			expect(selectFromListMock).toHaveBeenCalledWith(command,
				expect.objectContaining({ primaryKeyName: 'channelId', sortKeyName: 'name' }),
				expect.objectContaining({ preselectedId: 'command-line-channel-id' }))

			const listItems = selectFromListMock.mock.calls[0][2].listItems

			const list = [{ name: 'Channel' }] as Channel[]
			listChannelsMock.mockResolvedValueOnce(list)

			expect(await listItems()).toBe(list)

			expect(listChannelsMock).toHaveBeenCalledTimes(1)
			expect(listChannelsMock).toHaveBeenCalledWith({ includeReadOnly: false })
		})

		it('requests read-only channels when needed', async () => {
			chooseChannelOptionsWithDefaultsSpy.mockReturnValueOnce(
				{ allowIndex: false, includeReadOnly: true } as ChooseChannelOptions)
			selectFromListMock.mockImplementation(async () => 'chosen-channel-id')

			expect(await chooseChannel(command, 'prompt message', 'command-line-channel-id'))
				.toBe('chosen-channel-id')

			expect(chooseChannelOptionsWithDefaultsSpy).toHaveBeenCalledTimes(1)
			expect(chooseChannelOptionsWithDefaultsSpy).toHaveBeenCalledWith(undefined)
			expect(stringTranslateToIdMock).toHaveBeenCalledTimes(0)
			expect(selectFromListMock).toHaveBeenCalledTimes(1)
			expect(selectFromListMock).toHaveBeenCalledWith(command,
				expect.objectContaining({ primaryKeyName: 'channelId', sortKeyName: 'name' }),
				expect.objectContaining({ preselectedId: 'command-line-channel-id' }))

			const listItems = selectFromListMock.mock.calls[0][2].listItems

			const list = [{ name: 'Channel' }] as Channel[]
			listChannelsMock.mockResolvedValueOnce(list)

			expect(await listItems()).toBe(list)

			expect(listChannelsMock).toHaveBeenCalledTimes(1)
			expect(listChannelsMock).toHaveBeenCalledWith({ includeReadOnly: true })
		})

		describe('defaultConfig', () => {
			test('getItem uses channels.get', async () => {
				chooseChannelOptionsWithDefaultsSpy.mockReturnValueOnce(
					{ allowIndex: false, useConfigDefault: true } as ChooseChannelOptions)
				selectFromListMock.mockImplementation(async () => 'chosen-channel-id')

				expect(await chooseChannel(command, 'prompt message', undefined,
					{ useConfigDefault: true })).toBe('chosen-channel-id')

				const defaultValue = selectFromListMock.mock.calls[0][2].defaultValue

				expect(defaultValue).toBeDefined()
				const getItem = defaultValue?.getItem as (id: string) => Promise<Channel>
				expect(getItem).toBeDefined()
				getChannelsMock.mockResolvedValueOnce(channel)

				expect(await getItem('id-to-check')).toBe(channel)

				expect(getChannelsMock).toHaveBeenCalledTimes(1)
				expect(getChannelsMock).toHaveBeenCalledWith('id-to-check')
			})

			test('userMessage returns expected message', async () => {
				chooseChannelOptionsWithDefaultsSpy.mockReturnValueOnce(
					{ allowIndex: false, useConfigDefault: true } as ChooseChannelOptions)
				selectFromListMock.mockImplementation(async () => 'chosen-channel-id')

				expect(await chooseChannel(command, 'prompt message', undefined,
					{ useConfigDefault: true })).toBe('chosen-channel-id')

				const defaultValue = selectFromListMock.mock.calls[0][2].defaultValue

				expect(defaultValue).toBeDefined()
				const userMessage = defaultValue?.userMessage as (channel: Channel) => string
				expect(userMessage).toBeDefined()

				expect(userMessage(channel)).toBe('using previously specified default channel named "channel name" (channel-id)')
			})
		})
	})

	const apiListChannelsMock = jest.fn()
	const apiGetChannelsMock = jest.fn()
	const client = {
		channels: {
			list: apiListChannelsMock,
			get: apiGetChannelsMock,
		},
	} as unknown as SmartThingsClient

	describe('listChannels', () => {
		const result = [
			{
				'channelId': 'channel-id',
				'name': 'Channel Name',
			},
		]
		apiListChannelsMock.mockResolvedValue(result)

		it('lists channels', async () => {
			expect(await listChannels(client)).toBe(result)

			expect(apiListChannelsMock).toHaveBeenCalledTimes(1)
			expect(apiListChannelsMock).toHaveBeenCalledWith(expect.not.objectContaining({ includeReadOnly: true }))
		})

		it('lists channels including read-only', async () => {
			expect(await listChannels(client, { allOrganizations: false, includeReadOnly: true })).toBe(result)

			expect(apiListChannelsMock).toHaveBeenCalledTimes(1)
			expect(apiListChannelsMock).toHaveBeenCalledWith({ includeReadOnly: true })
		})

		it('passes subscriber filters on', async () => {
			expect(await listChannels(client, { subscriberType: 'HUB', subscriberId: 'subscriber-id', allOrganizations: false, includeReadOnly: false })).toBe(result)

			expect(apiListChannelsMock).toHaveBeenCalledTimes(1)
			expect(apiListChannelsMock).toHaveBeenCalledWith({
				includeReadOnly: false, subscriberType: 'HUB', subscriberId: 'subscriber-id',
			})
		})

		it('lists channels in all organizations', async () => {
			const thisResult = [
				{ ...result[0], organization: 'Organization One' },
				{ ...result[0], organization: 'Organization Two' },
			]
			const forAllOrganizationsMock = jest.mocked(forAllOrganizations).mockResolvedValueOnce(thisResult)

			expect(await listChannels(client, { allOrganizations: true, includeReadOnly: false })).toStrictEqual(thisResult)

			expect(forAllOrganizationsMock).toHaveBeenCalledTimes(1)
			expect(forAllOrganizationsMock).toHaveBeenCalledWith(client, expect.any(Function))
			expect(apiListChannelsMock).toHaveBeenCalledTimes(0)

			const listChannelsFunction = forAllOrganizationsMock.mock.calls[0][1]

			expect(await listChannelsFunction(client, { organizationId: 'unused' } as OrganizationResponse)).toBe(result)
		})

		it('throws error when both allOrganizations and includeReadOnly included', async () => {
			await expect(listChannels(client, { allOrganizations: true, includeReadOnly: true }))
				.rejects.toThrow('includeReadOnly and allOrganizations options are incompatible')
		})
	})

	describe('withChannelNames', () => {
		const thingWithChannel1 = { channelId: 'channel-id-1' }
		const channel1 = { channelId: 'channel-id-1', name: 'Channel 1' } as Channel
		const thingWithChannel2 = { channelId: 'channel-id-2' }
		const channel2 = { channelId: 'channel-id-2', name: 'Channel 2' } as Channel

		it('adds channel name to single item', async () => {
			apiGetChannelsMock.mockResolvedValueOnce(channel1)

			expect(await withChannelNames(client, thingWithChannel1)).toStrictEqual(
				{ channelId: 'channel-id-1', channelName: 'Channel 1' },
			)

			expect(apiListChannelsMock).toHaveBeenCalledTimes(0)
			expect(apiGetChannelsMock).toHaveBeenCalledTimes(1)
			expect(apiGetChannelsMock).toHaveBeenCalledWith('channel-id-1')
		})

		it('adds channel name to multiple items', async () => {
			apiListChannelsMock.mockResolvedValueOnce([channel1, channel2])

			expect(await withChannelNames(client, [thingWithChannel1, thingWithChannel2])).toStrictEqual([
				{ channelId: 'channel-id-1', channelName: 'Channel 1' },
				{ channelId: 'channel-id-2', channelName: 'Channel 2' },
			])

			expect(apiListChannelsMock).toHaveBeenCalledTimes(1)
			expect(apiListChannelsMock).toHaveBeenCalledWith(expect.objectContaining({ includeReadOnly: true }))
			expect(apiGetChannelsMock).toHaveBeenCalledTimes(0)
		})

		it('looks up and adds channel name when missing from list', async () => {
			apiListChannelsMock.mockResolvedValueOnce([channel1])
			apiGetChannelsMock.mockResolvedValueOnce(channel2)

			expect(await withChannelNames(client, [thingWithChannel1, thingWithChannel2])).toStrictEqual([
				{ channelId: 'channel-id-1', channelName: 'Channel 1' },
				{ channelId: 'channel-id-2', channelName: 'Channel 2' },
			])

			expect(apiListChannelsMock).toHaveBeenCalledTimes(1)
			expect(apiListChannelsMock).toHaveBeenCalledWith(expect.objectContaining({ includeReadOnly: true }))
			expect(apiGetChannelsMock).toHaveBeenCalledTimes(1)
			expect(apiGetChannelsMock).toHaveBeenCalledWith('channel-id-2')
		})
	})
})
