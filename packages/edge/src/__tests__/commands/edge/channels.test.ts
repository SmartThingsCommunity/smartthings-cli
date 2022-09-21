import { Channel, ChannelsEndpoint, SmartThingsClient } from '@smartthings/core-sdk'

import { outputItemOrList } from '@smartthings/cli-lib'

import ChannelsCommand from '../../../commands/edge/channels'
import { listChannels } from '../../../lib/commands/channels-util'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		outputItemOrList: jest.fn(),
	}
})
jest.mock('../../../../src/lib/commands/channels-util')

describe('ChannelsCommand', () => {
	const outputItemOrListMock = jest.mocked(outputItemOrList)

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('uses outputItemOrList', async () => {
		await expect(ChannelsCommand.run([])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			expect.any(ChannelsCommand),
			expect.objectContaining({
				primaryKeyName: 'channelId',
				listTableFieldDefinitions: expect.not.arrayContaining(['organization']),
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)
	})

	it('includes organization in listing output', async () => {
		await expect(ChannelsCommand.run(['--all-organizations'])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			expect.any(ChannelsCommand),
			expect.objectContaining({
				primaryKeyName: 'channelId',
				listTableFieldDefinitions: expect.arrayContaining(['organization']),
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)
	})

	it('passes subscriber type and id on to listChannels', async () => {
		await expect(ChannelsCommand.run([
			'--subscriber-type=HUB',
			'--subscriber-id=subscriber-id',
		])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			expect.any(ChannelsCommand),
			expect.objectContaining({ primaryKeyName: 'channelId' }),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		const listFunction = outputItemOrListMock.mock.calls[0][3]

		const channelList = [{ channelId: 'channel-in-list-id' }] as Channel[]
		const listChannelsMock = jest.mocked(listChannels).mockResolvedValueOnce(channelList)

		expect(await listFunction()).toBe(channelList)

		expect(listChannelsMock).toHaveBeenCalledTimes(1)
		expect(listChannelsMock).toHaveBeenCalledWith(expect.any(SmartThingsClient),
			{ subscriberType: 'HUB', subscriberId: 'subscriber-id' })
	})

	test('get item function uses channels.get with id', async () => {
		await expect(ChannelsCommand.run(['id-from-command-line'])).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			expect.any(ChannelsCommand),
			expect.objectContaining({ primaryKeyName: 'channelId' }),
			'id-from-command-line',
			expect.any(Function),
			expect.any(Function),
		)

		const getFunction = outputItemOrListMock.mock.calls[0][4]

		const channel = { channelId: 'channel-in-list-id' } as Channel
		const getSpy = jest.spyOn(ChannelsEndpoint.prototype, 'get').mockResolvedValueOnce(channel)

		expect(await getFunction('resolved-channel-id')).toBe(channel)

		expect(getSpy).toHaveBeenCalledTimes(1)
		expect(getSpy).toHaveBeenCalledWith('resolved-channel-id')
	})
})
