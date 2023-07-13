import { SchemaApp, SchemaAppInvitation, SmartThingsClient } from '@smartthings/core-sdk'

import { APICommand, ValueTableFieldDefinition, chooseOptionsWithDefaults, selectFromList, stringTranslateToId } from '@smartthings/cli-lib'

import { chooseSchemaInvitation, getSingleInvite, inviteTableFieldDefinitions } from '../../../lib/commands/invites-utils'
import { chooseSchemaApp } from '../../../lib/commands/schema-util'


jest.mock('../../../lib/commands/schema-util')

describe('chooseSchemaInvitation', () => {
	const chooseOptionsDefaults = {
		allowIndex: false,
		verbose: false,
		useConfigDefault: false,
	}

	const invitesSchemaListMock = jest.fn()
	const client = {
		invitesSchema: {
			list: invitesSchemaListMock,
		},
	} as unknown as SmartThingsClient
	const command = { client } as APICommand<typeof APICommand.flags>

	const chooseOptionsWithDefaultsMock = jest.mocked(chooseOptionsWithDefaults).mockReturnValue(chooseOptionsDefaults)
	const selectFromListMock = jest.mocked(selectFromList).mockResolvedValue('chosen-invitation-id')
	const stringTranslateToIdMock = jest.mocked(stringTranslateToId).mockResolvedValue('translated-id')

	it('does not translate index id by default', async () => {
		expect(await chooseSchemaInvitation(command)).toBe('chosen-invitation-id')

		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledTimes(1)
		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledWith(undefined)
		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(command,
			expect.objectContaining({ itemName: 'schema app invitation' }),
			{ preselectedId: undefined, listItems: expect.any(Function) })

		expect(stringTranslateToIdMock).toHaveBeenCalledTimes(0)
	})

	it('translates id from index when allowed to', async () => {
		chooseOptionsWithDefaultsMock.mockReturnValueOnce({ ...chooseOptionsDefaults, allowIndex: true })
		expect(await chooseSchemaInvitation(command, 'schema-app-id-from-args', 'id-from-args', { allowIndex: true  })).toBe('chosen-invitation-id')

		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledTimes(1)
		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledWith({ allowIndex: true })
		expect(stringTranslateToIdMock).toHaveBeenCalledTimes(1)
		expect(stringTranslateToIdMock).toHaveBeenCalledWith(
			expect.objectContaining({ itemName: 'schema app invitation' }),
			'id-from-args',
			expect.any(Function),
		)
		expect(selectFromListMock).toHaveBeenCalledTimes(1)
	})

	test('listItems', async () => {
		expect(await chooseSchemaInvitation(command, 'schema-app-id-from-args', 'id-from-args')).toBe('chosen-invitation-id')

		const listItems = selectFromListMock.mock.calls[0][2].listItems

		const chooseSchemaAppMock = jest.mocked(chooseSchemaApp).mockResolvedValue('chosen-schema-app-id')
		const invitesSchemaList = [{ id: 'invitation-id-1' }]
		invitesSchemaListMock.mockResolvedValueOnce(invitesSchemaList)

		expect(await listItems()).toBe(invitesSchemaList)

		expect(chooseSchemaAppMock).toHaveBeenCalledTimes(1)
		expect(chooseSchemaAppMock).toHaveBeenCalledWith(command, 'schema-app-id-from-args')
		expect(invitesSchemaListMock).toHaveBeenCalledTimes(1)
		expect(invitesSchemaListMock).toHaveBeenCalledWith('chosen-schema-app-id')
	})
})

test.each`
	input                             | expected
	${undefined}                             | ${'none'}
	${1694617703}        | ${'2023-09-13T15:08:23.000Z'}
`('expiration displays $expected for $input', ({ input, expected }) => {
	const value = (inviteTableFieldDefinitions[2] as
		ValueTableFieldDefinition<SchemaAppInvitation>).value as (input: SchemaAppInvitation) => string
	expect(value({ expiration: input } as SchemaAppInvitation)).toBe(expected)
})

describe('getSingleInvite', () => {
	const invitation1 = { id: 'invitation-id-1' } as SchemaAppInvitation
	const invitation2 = { id: 'invitation-id-2' } as SchemaAppInvitation
	const invitation3 = { id: 'invitation-id-3' } as SchemaAppInvitation
	const invitationList = [invitation1, invitation2, invitation3]

	const schemaApp1 = { endpointAppId: 'schema-app-id-1' } as SchemaApp
	const schemaApp2 = { endpointAppId: 'schema-app-id-2' } as SchemaApp
	const schemaApp3 = { endpointAppId: 'schema-app-id-3' } as SchemaApp
	const schemaAppList = [schemaApp1, schemaApp2, schemaApp3]

	const listInvitesMock = jest.fn().mockResolvedValue(invitationList)
	const listSchemaMock = jest.fn().mockResolvedValue(schemaAppList)
	const client = {
		invitesSchema: {
			list: listInvitesMock,
		},
		schema: {
			list: listSchemaMock,
		},
	} as unknown as SmartThingsClient

	describe('with schemaAppId specified', () => {
		it('returns invitation with matching id', async () => {
			expect(await getSingleInvite(client, 'schema-app-id', 'invitation-id-2')).toBe(invitation2)

			expect(listInvitesMock).toHaveBeenCalledTimes(1)
			expect(listInvitesMock).toHaveBeenCalledWith('schema-app-id')

			expect(listSchemaMock).toHaveBeenCalledTimes(0)
		})

		it('throws an error when no matching invite found', async () => {
			await expect(getSingleInvite(client, 'schema-app-id', 'bad-invitation-id')).rejects.toThrow()

			expect(listSchemaMock).toHaveBeenCalledTimes(0)
			expect(listInvitesMock).toHaveBeenCalledTimes(1)
			expect(listInvitesMock).toHaveBeenCalledWith('schema-app-id')
		})
	})

	describe('with schemaAppId specified', () => {
		it('searches schema apps when none specified', async () => {
			listInvitesMock.mockResolvedValueOnce([invitation1])
			listInvitesMock.mockResolvedValueOnce([invitation3, invitation2])

			expect(await getSingleInvite(client, undefined, 'invitation-id-2')).toBe(invitation2)

			expect(listSchemaMock).toHaveBeenCalledTimes(1)
			expect(listSchemaMock).toHaveBeenCalledWith()
			expect(listInvitesMock).toHaveBeenCalledTimes(2)
			expect(listInvitesMock).toHaveBeenCalledWith('schema-app-id-1')
			expect(listInvitesMock).toHaveBeenCalledWith('schema-app-id-2')
		})

		it('skips schema apps with no id', async () => {
			listSchemaMock.mockResolvedValueOnce([{} as SchemaApp, schemaApp1, schemaApp2, schemaApp3])
			listInvitesMock.mockResolvedValueOnce([invitation1])
			listInvitesMock.mockResolvedValueOnce([invitation3, invitation2])

			expect(await getSingleInvite(client, undefined, 'invitation-id-2')).toBe(invitation2)

			expect(listSchemaMock).toHaveBeenCalledTimes(1)
			expect(listSchemaMock).toHaveBeenCalledWith()
			expect(listInvitesMock).toHaveBeenCalledTimes(2)
			expect(listInvitesMock).toHaveBeenCalledWith('schema-app-id-1')
			expect(listInvitesMock).toHaveBeenCalledWith('schema-app-id-2')
		})

		it('throws an error when no matching invite found', async () => {
			await expect(getSingleInvite(client, undefined, 'bad-invitation-id')).rejects.toThrow()

			expect(listSchemaMock).toHaveBeenCalledTimes(1)
			expect(listSchemaMock).toHaveBeenCalledWith()
			expect(listInvitesMock).toHaveBeenCalledTimes(3)
			expect(listInvitesMock).toHaveBeenCalledWith('schema-app-id-1')
			expect(listInvitesMock).toHaveBeenCalledWith('schema-app-id-2')
			expect(listInvitesMock).toHaveBeenCalledWith('schema-app-id-3')
		})
	})
})
