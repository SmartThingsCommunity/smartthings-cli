import { outputList } from '@smartthings/cli-lib'
import { EnrolledChannel, HubdevicesEndpoint } from '@smartthings/core-sdk'

import ChannelsEnrollmentsCommand from '../../../../commands/edge/channels/enrollments'
import { chooseHub } from '../../../../lib/commands/drivers-util'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		outputList: jest.fn(),
	}
})
jest.mock('../../../../../src/lib/commands/drivers-util')

describe('ChannelsEnrollmentsCommand', () => {
	const chooseHubMock = jest.mocked(chooseHub)
	const outputListMock = jest.mocked(outputList)
	const apiEnrolledChannelsSpy = jest.spyOn(HubdevicesEndpoint.prototype, 'enrolledChannels')

	it('displays enrolled channels', async () => {
		chooseHubMock.mockResolvedValueOnce('chosen-hub-id')
		outputListMock.mockResolvedValueOnce([])

		await expect(ChannelsEnrollmentsCommand.run([])).resolves.not.toThrow()

		expect(chooseHubMock).toHaveBeenCalledTimes(1)
		expect(chooseHubMock).toHaveBeenCalledWith(expect.any(ChannelsEnrollmentsCommand),
			'Select a hub.', undefined, { allowIndex: true, useConfigDefault: true })
		expect(outputListMock).toHaveBeenCalledTimes(1)
		expect(outputListMock).toHaveBeenCalledWith(expect.any(ChannelsEnrollmentsCommand),
			expect.objectContaining({ primaryKeyName: 'channelId' }), expect.any(Function))
	})

	it('uses enrolledChannels to list enrolled channels', async () => {
		chooseHubMock.mockResolvedValueOnce('chosen-hub-id')
		outputListMock.mockResolvedValueOnce([])

		await expect(ChannelsEnrollmentsCommand.run([])).resolves.not.toThrow()

		const channelList = [{ channelId: 'enrolled-channel-id' } as EnrolledChannel]
		apiEnrolledChannelsSpy.mockResolvedValueOnce(channelList)
		const listItems = outputListMock.mock.calls[0][2]

		expect(await listItems()).toBe(channelList)
	})
})
