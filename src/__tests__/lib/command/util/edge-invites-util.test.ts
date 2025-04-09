import { jest } from '@jest/globals'

import type { Channel, ChannelsEndpoint } from '@smartthings/core-sdk'

import type { EdgeCommand } from '../../../../lib/command/edge-command.js'
import { buildListFunction } from '../../../../lib/command/util/edge-invites-util.js'
import { Invitation, invitesEndpoint } from '../../../../lib/edge/endpoints/invites.js'


describe('buildListFunction', () => {
	const apiChannelsListMock = jest.fn<typeof ChannelsEndpoint.prototype.list>()
	const apiInvitesListMock =  jest.fn<typeof invitesEndpoint.prototype.list>()
	const command = {
		client: {
			channels: {
				list: apiChannelsListMock,
			},
		},
		edgeClient: {
			invites: {
				list: apiInvitesListMock,
			},
		},
	} as unknown as EdgeCommand

	const invite1 = { id: 'invite-id-1' } as Invitation
	const invite2 = { id: 'invite-id-2' } as Invitation
	const invite3 = { id: 'invite-id-3' } as Invitation

	it('lists invites from specified channel', async () => {
		apiInvitesListMock.mockResolvedValueOnce([invite1, invite2])

		expect(await buildListFunction(command, 'specified-channel-id')()).toStrictEqual([invite1, invite2])

		expect(apiInvitesListMock).toHaveBeenCalledExactlyOnceWith('specified-channel-id')

		expect(apiChannelsListMock).not.toHaveBeenCalled()
	})

	it('lists invites from all channels when none is specified', async () => {
		const channels = [{ channelId: 'channel-id-1' }, { channelId: 'channel-id-2' }] as Channel[]
		apiChannelsListMock.mockResolvedValueOnce(channels)
		apiInvitesListMock.mockResolvedValueOnce([invite1, invite2])
		apiInvitesListMock.mockResolvedValueOnce([invite3])

		expect(await buildListFunction(command)()).toStrictEqual([invite1, invite2, invite3])

		expect(apiChannelsListMock).toHaveBeenCalledExactlyOnceWith()
		expect(apiInvitesListMock).toHaveBeenCalledTimes(2)
		expect(apiInvitesListMock).toHaveBeenCalledWith('channel-id-1')
		expect(apiInvitesListMock).toHaveBeenCalledWith('channel-id-2')
	})
})
