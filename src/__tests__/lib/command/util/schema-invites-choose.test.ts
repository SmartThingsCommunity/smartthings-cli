import { jest } from '@jest/globals'

import { InvitesSchemaAppEndpoint, type SchemaAppInvitation } from '@smartthings/core-sdk'

import type { APICommand } from '../../../../lib/command/api-command.js'
import type { chooseSchemaApp } from '../../../../lib/command/util/schema-util.js'
import type { ChooseFunction, createChooseFn } from '../../../../lib/command/util/util-util.js'


const chooseSchemaAppMock = jest.fn<typeof chooseSchemaApp>().mockResolvedValueOnce('chosen-schema-app-id')
jest.unstable_mockModule('../../../../lib/command/util/schema-util.js', () => ({
	chooseSchemaApp: chooseSchemaAppMock,
}))

const createChooseFnMock = jest.fn<typeof createChooseFn<SchemaAppInvitation>>()
jest.unstable_mockModule('../../../../lib/command/util/util-util.js', () => ({
	createChooseFn: createChooseFnMock,
}))


const { chooseSchemaInvitationFn } = await import('../../../../lib/command/util/schema-invites-choose.js')


test('chooseSchemaInvitationFn', async () => {
	const apiInvitesSchemaListMock = jest.fn<typeof InvitesSchemaAppEndpoint.prototype.list>()
	const command = {
		client: {
			invitesSchema: {
				list: apiInvitesSchemaListMock,
			},
		},
	} as unknown as APICommand
	const invitations = [{ id: 'invitation-id' }] as SchemaAppInvitation[]

	const chooseSchemaInvitationMock = jest.fn<ChooseFunction<SchemaAppInvitation>>()
	createChooseFnMock.mockReturnValueOnce(chooseSchemaInvitationMock)

	expect(chooseSchemaInvitationFn('schema-app-from-args')).toBe(chooseSchemaInvitationMock)

	expect(createChooseFnMock).toHaveBeenCalledExactlyOnceWith(
		expect.objectContaining({ itemName: 'Schema App invitation' }),
		expect.any(Function),
	)

	const listItems = createChooseFnMock.mock.calls[0][1]
	apiInvitesSchemaListMock.mockResolvedValueOnce(invitations)

	expect(await listItems(command)).toBe(invitations)

	expect(chooseSchemaAppMock).toHaveBeenCalledExactlyOnceWith(command, 'schema-app-from-args', { autoChoose: true })
	expect(apiInvitesSchemaListMock).toHaveBeenCalledExactlyOnceWith('chosen-schema-app-id')
})
