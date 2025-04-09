import { jest } from '@jest/globals'

import type { APICommand } from '../../../lib/command/api-command.js'
import type { EdgeClient, newEdgeClient } from '../../../lib/edge/edge-client.js'
import type { InvitesEndpoint } from '../../../lib/edge/endpoints/invites.js'


const newEdgeClientMock = jest.fn<typeof newEdgeClient>()
jest.unstable_mockModule('../../../lib/edge/edge-client.js', () => ({
	newEdgeClient: newEdgeClientMock,
}))


const { edgeCommand } = await import('../../../lib/command/edge-command.js')

test('edgeCommand', () => {
	const edgeClientMock = { invites: {} as InvitesEndpoint } as EdgeClient
	newEdgeClientMock.mockReturnValueOnce(edgeClientMock)
	const parent = { profileName: 'default' } as APICommand

	expect(edgeCommand(parent)).toStrictEqual({ profileName: 'default', edgeClient: edgeClientMock })
})
