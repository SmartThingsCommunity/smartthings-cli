import { jest } from '@jest/globals'

import { type EndpointClient, NoOpAuthenticator, type EndpointClientConfig } from '@smartthings/core-sdk'

import type { newEndpointClient } from '../../../../lib/command/util/st-client-wrapper.js'
import type { Invitation, InvitationCreate, InvitationSummary } from '../../../../lib/edge/endpoints/invites.js'


const newEndpointClientMock = jest.fn<typeof newEndpointClient>()
jest.unstable_mockModule('../../../../lib/command/util/st-client-wrapper.js', () => ({
	newEndpointClient: newEndpointClientMock,
}))


const { invitesEndpoint } = await import('../../../../lib/edge/endpoints/invites.js')


describe('invitesEndpoint', () => {
	const postMock = jest.fn<typeof EndpointClient.prototype.post>()
	const getMock = jest.fn<typeof EndpointClient.prototype.get>()
	const getPagedItemsMock = jest.fn<typeof EndpointClient.prototype.getPagedItems>()
	const deleteMock = jest.fn<typeof EndpointClient.prototype.delete>()
	const putMock = jest.fn<typeof EndpointClient.prototype.put>()
	const clientMock = {
		post: postMock,
		get: getMock,
		getPagedItems: getPagedItemsMock,
		delete: deleteMock,
		put: putMock,
	} as unknown as EndpointClient
	newEndpointClientMock.mockReturnValue(clientMock)
	const config = {
		authenticator: new NoOpAuthenticator(),
	} as EndpointClientConfig

	test('create', async () => {
		const endpoint = invitesEndpoint(config)

		expect(newEndpointClientMock).toHaveBeenCalledExactlyOnceWith('invites', config)

		const invitationCreate = { profileId: 'profile-id' } as InvitationCreate
		const invitationSummary = { invitationId: 'invitation-id' } as InvitationSummary
		postMock.mockResolvedValueOnce(invitationSummary)

		expect(await endpoint.create(invitationCreate)).toBe(invitationSummary)

		expect(postMock).toHaveBeenCalledExactlyOnceWith('', invitationCreate)
	})

	test('get', async () => {
		const endpoint = invitesEndpoint(config)

		const invite = { id: 'invite-id' } as Invitation
		getMock.mockResolvedValueOnce(invite)

		expect(await endpoint.get('wanted-invite-id')).toBe(invite)

		expect(getMock).toHaveBeenCalledExactlyOnceWith('wanted-invite-id')
	})

	test('list', async () => {
		const endpoint = invitesEndpoint(config)

		const invites = [{ id: 'invite-id' } as Invitation]
		getPagedItemsMock.mockResolvedValueOnce(invites)

		expect(await endpoint.list('channel-id')).toBe(invites)

		expect(getPagedItemsMock).toHaveBeenCalledExactlyOnceWith('', { resource: 'st1:developer::channel/channel-id' })
	})

	test('delete', async () => {
		const endpoint = invitesEndpoint(config)

		await expect(endpoint.delete('invite-id')).resolves.not.toThrow()

		expect(deleteMock).toHaveBeenCalledExactlyOnceWith('invite-id')
	})

	test('accept', async () => {
		const endpoint = invitesEndpoint(config)

		await expect(endpoint.accept('invite-id')).resolves.not.toThrow()

		expect(putMock).toHaveBeenCalledExactlyOnceWith('invite-id/accept')
	})
})
