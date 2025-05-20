import { jest } from '@jest/globals'

import type {
	InvitesSchemaAppEndpoint,
	SchemaApp,
	SchemaAppInvitation,
	SchemaEndpoint,
	SmartThingsClient,
} from '@smartthings/core-sdk'


const { addAppDetails, getSingleInvite } = await import('../../../../lib/command/util/schema-invites.js')


describe('addAppDetails', () => {
	it('handles optional fields', () => {
		expect(addAppDetails({
			id: 'invitation-id',
			schemaAppId: 'schema-app-id',
		} as SchemaAppInvitation, {
		} as SchemaApp)).toStrictEqual({
			id: 'invitation-id',
			schemaAppId: 'schema-app-id',
			schemaAppName: undefined,
			sort: ':schema-app-id :invitation-id',
		})
	})

	it('handles populated optional fields', () => {
		expect(addAppDetails({
			id: 'invitation-id',
			description: 'invitation-description',
			schemaAppId: 'schema-app-id',
		} as SchemaAppInvitation, {
			appName: 'schema-app-name',
		} as SchemaApp)).toStrictEqual({
			id: 'invitation-id',
			description: 'invitation-description',
			schemaAppId: 'schema-app-id',
			schemaAppName: 'schema-app-name',
			sort: 'schema-app-name:schema-app-id invitation-description:invitation-id',
		})
	})
})

describe('getSingleInvite', () => {
	const invitation1 = { id: 'invitation-id-1' } as SchemaAppInvitation
	const invitation2 = { id: 'invitation-id-2', schemaAppId: 'invite-2-app-id' } as SchemaAppInvitation
	const invitation3 = { id: 'invitation-id-3' } as SchemaAppInvitation
	const invitationList = [invitation1, invitation2, invitation3]

	const schemaApp1 = { endpointAppId: 'schema-app-id-1' } as SchemaApp
	const schemaApp2 = { endpointAppId: 'schema-app-id-2', appName: 'Schema App 2' } as SchemaApp
	const schemaApp3 = { endpointAppId: 'schema-app-id-3' } as SchemaApp
	const schemaAppList = [schemaApp1, schemaApp2, schemaApp3]

	const apiInvitesSchemaListMock = jest.fn<typeof InvitesSchemaAppEndpoint.prototype.list>()
		.mockResolvedValue(invitationList)
	const apiSchemaListMock = jest.fn<typeof SchemaEndpoint.prototype.list>().mockResolvedValue(schemaAppList)
	const apiSchemaGetMock = jest.fn<typeof SchemaEndpoint.prototype.get>()
	const client = {
		invitesSchema: {
			list: apiInvitesSchemaListMock,
		},
		schema: {
			get: apiSchemaGetMock,
			list: apiSchemaListMock,
		},
	} as unknown as SmartThingsClient

	describe('with schemaAppId specified', () => {
		it('returns invitation with matching id', async () => {
			apiSchemaGetMock.mockResolvedValueOnce(schemaApp2)

			expect(await getSingleInvite(client, 'schema-app-id', 'invitation-id-2')).toStrictEqual({
				...invitation2,
				schemaAppName: 'Schema App 2',
				sort: 'Schema App 2:invite-2-app-id :invitation-id-2',
			})

			expect(apiSchemaGetMock).toHaveBeenCalledTimes(1)
			expect(apiSchemaGetMock).toHaveBeenCalledWith('invite-2-app-id')
			expect(apiInvitesSchemaListMock).toHaveBeenCalledTimes(1)
			expect(apiInvitesSchemaListMock).toHaveBeenCalledWith('schema-app-id')

			expect(apiSchemaListMock).toHaveBeenCalledTimes(0)
		})

		it('throws an error when no matching invite found', async () => {
			await expect(getSingleInvite(client, 'schema-app-id', 'bad-invitation-id')).rejects.toThrow()

			expect(apiInvitesSchemaListMock).toHaveBeenCalledTimes(1)
			expect(apiInvitesSchemaListMock).toHaveBeenCalledWith('schema-app-id')

			expect(apiSchemaGetMock).toHaveBeenCalledTimes(0)
			expect(apiSchemaListMock).toHaveBeenCalledTimes(0)
		})
	})

	describe('with schemaAppId not specified', () => {
		it('searches schema apps when none specified', async () => {
			apiInvitesSchemaListMock.mockResolvedValueOnce([invitation1])
			apiInvitesSchemaListMock.mockResolvedValueOnce([invitation3, invitation2])

			expect(await getSingleInvite(client, undefined, 'invitation-id-2')).toStrictEqual({
				...invitation2,
				schemaAppName: 'Schema App 2',
				sort: 'Schema App 2:invite-2-app-id :invitation-id-2',
			})

			expect(apiSchemaListMock).toHaveBeenCalledTimes(1)
			expect(apiSchemaListMock).toHaveBeenCalledWith()
			expect(apiInvitesSchemaListMock).toHaveBeenCalledTimes(2)
			expect(apiInvitesSchemaListMock).toHaveBeenCalledWith('schema-app-id-1')
			expect(apiInvitesSchemaListMock).toHaveBeenCalledWith('schema-app-id-2')

			expect(apiSchemaGetMock).toHaveBeenCalledTimes(0)
		})

		it('skips schema apps with no id', async () => {
			apiSchemaListMock.mockResolvedValueOnce([{} as SchemaApp, schemaApp1, schemaApp2, schemaApp3])
			apiInvitesSchemaListMock.mockResolvedValueOnce([invitation1])
			apiInvitesSchemaListMock.mockResolvedValueOnce([invitation3, invitation2])

			expect(await getSingleInvite(client, undefined, 'invitation-id-2')).toStrictEqual({
				...invitation2,
				schemaAppName: 'Schema App 2',
				sort: 'Schema App 2:invite-2-app-id :invitation-id-2',
			})

			expect(apiSchemaListMock).toHaveBeenCalledTimes(1)
			expect(apiSchemaListMock).toHaveBeenCalledWith()
			expect(apiInvitesSchemaListMock).toHaveBeenCalledTimes(2)
			expect(apiInvitesSchemaListMock).toHaveBeenCalledWith('schema-app-id-1')
			expect(apiInvitesSchemaListMock).toHaveBeenCalledWith('schema-app-id-2')

			expect(apiSchemaGetMock).toHaveBeenCalledTimes(0)
		})

		it('throws an error when no matching invite found', async () => {
			await expect(getSingleInvite(client, undefined, 'bad-invitation-id')).rejects.toThrow()

			expect(apiSchemaListMock).toHaveBeenCalledTimes(1)
			expect(apiSchemaListMock).toHaveBeenCalledWith()
			expect(apiInvitesSchemaListMock).toHaveBeenCalledTimes(3)
			expect(apiInvitesSchemaListMock).toHaveBeenCalledWith('schema-app-id-1')
			expect(apiInvitesSchemaListMock).toHaveBeenCalledWith('schema-app-id-2')
			expect(apiInvitesSchemaListMock).toHaveBeenCalledWith('schema-app-id-3')

			expect(apiSchemaGetMock).toHaveBeenCalledTimes(0)
		})
	})
})
