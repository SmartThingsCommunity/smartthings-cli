import { jest } from '@jest/globals'

import { NoOpAuthenticator } from '@smartthings/core-sdk'

import type { APICommand } from '../../../lib/command/api-command.js'
import type { InvitesEndpoint, invitesEndpoint } from '../../../lib/edge/endpoints/invites.js'


const invitesEndpointMock = jest.fn<typeof invitesEndpoint>()
jest.unstable_mockModule('../../../lib/edge/endpoints/invites.js', () => ({
	invitesEndpoint: invitesEndpointMock,
}))


const { newEdgeClient } = await import('../../../lib/edge/edge-client.js')

test('newEdgeClient', () => {
	const command = { client: { config: { authenticator: new NoOpAuthenticator() } } } as APICommand
	const invites = {} as InvitesEndpoint

	invitesEndpointMock.mockReturnValueOnce(invites)

	expect(newEdgeClient(command)).toStrictEqual({ invites })

	expect(invitesEndpointMock).toHaveBeenCalledExactlyOnceWith(command.client.config)
})
