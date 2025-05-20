import { jest } from '@jest/globals'

import type { SchemaApp, SchemaAppInvitationCreate } from '@smartthings/core-sdk'

import type { APICommand } from '../../../../lib/command/api-command.js'
import type { chooseSchemaApp, getSchemaAppEnsuringOrganization } from '../../../../lib/command/util/schema-util.js'
import type {
	createFromUserInput,
	InputDefinition,
	objectDef,
	optionalIntegerDef,
	optionalStringDef,
} from '../../../../lib/item-input/index.js'
import { buildInputDefMock } from '../../../test-lib/input-type-mock.js'


const createFromUserInputMock = jest.fn<typeof createFromUserInput>()
const objectDefMock = jest.fn<typeof objectDef<SchemaAppInvitationCreate>>()
const optionalStringDefMock = jest.fn<typeof optionalStringDef>()
const optionalIntegerDefMock = jest.fn<typeof optionalIntegerDef>()
jest.unstable_mockModule('../../../../lib/item-input/index.js', () => ({
	createFromUserInput: createFromUserInputMock,
	objectDef: objectDefMock,
	optionalIntegerDef: optionalIntegerDefMock,
	optionalStringDef: optionalStringDefMock,
}))

const chooseSchemaAppMock = jest.fn<typeof chooseSchemaApp>().mockResolvedValue('chosen-schema-app-id')
const getSchemaAppEnsuringOrganizationMock = jest.fn<typeof getSchemaAppEnsuringOrganization>()
jest.unstable_mockModule('../../../../lib/command/util/schema-util.js', () => ({
	chooseSchemaApp: chooseSchemaAppMock,
	getSchemaAppEnsuringOrganization: getSchemaAppEnsuringOrganizationMock,
}))


const { getInputFromUser } = await import('../../../../lib/command/util/schema-invites-user-input.js')


describe('getInputFromUser', () => {
	const command = {} as APICommand
	const flags = { profile: 'default', schemaApp: 'cmd-line-schema-app-id' }

	const descriptionDefMock = buildInputDefMock<string | undefined>('Description Mock')
	const acceptLimitDefMock = buildInputDefMock<number | undefined>('Accept Limit Mock')
	const invitationDefMock = buildInputDefMock<SchemaAppInvitationCreate>('Schema App Invitation Mock')
	optionalStringDefMock.mockReturnValue(descriptionDefMock)
	optionalIntegerDefMock.mockReturnValue(acceptLimitDefMock)
	objectDefMock.mockReturnValue(invitationDefMock)

	const invitationCreate: SchemaAppInvitationCreate = { schemaAppId: 'schema-app-id' }
	createFromUserInputMock.mockResolvedValue(invitationCreate)

	it('builds input definitions correctly', async () => {
		expect(await getInputFromUser(command, flags)).toBe(invitationCreate)

		expect(optionalStringDefMock).toHaveBeenCalledExactlyOnceWith('Description')
		expect(optionalIntegerDefMock).toHaveBeenCalledExactlyOnceWith(
			'Accept Limit',
			expect.objectContaining({ helpText: expect.stringContaining('Enter the maximum') }),
		)
		expect(objectDefMock).toHaveBeenCalledExactlyOnceWith(
			'Schema App Invitation',
			expect.objectContaining({ description: descriptionDefMock, acceptLimit: acceptLimitDefMock }),
		)
		expect(createFromUserInputMock).toHaveBeenCalledExactlyOnceWith(command, invitationDefMock, { dryRun: false })
	})

	describe('schemaAppIdDef', () => {
		const schemaApp: SchemaApp = { userEmail: 'user@example.com', appName: 'Schema App Name' }
		getSchemaAppEnsuringOrganizationMock.mockResolvedValue({ schemaApp, organizationWasUpdated: false })

		const getSchemaAppIdDef = async (): Promise<InputDefinition<string>> => {
			await getInputFromUser(command, flags)
			return objectDefMock.mock.calls[0][1].schemaAppId
		}

		it('prompts for a schema app', async () => {
			const schemaAppIdDef = await getSchemaAppIdDef()
			const buildFromUserInput = schemaAppIdDef.buildFromUserInput

			expect(await buildFromUserInput()).toBe('chosen-schema-app-id')

			expect(chooseSchemaAppMock)
				.toHaveBeenCalledExactlyOnceWith(command, 'cmd-line-schema-app-id', { autoChoose: true })
			expect(getSchemaAppEnsuringOrganizationMock)
				.toHaveBeenCalledExactlyOnceWith(command, 'chosen-schema-app-id', flags)
		})

		it('only calls getSchemaAppEnsuringOrganization once per schema app', async () => {
			const schemaAppIdDef = await getSchemaAppIdDef()
			const buildFromUserInput = schemaAppIdDef.buildFromUserInput

			expect(await buildFromUserInput()).toBe('chosen-schema-app-id')
			expect(await buildFromUserInput()).toBe('chosen-schema-app-id')

			expect(chooseSchemaAppMock).toHaveBeenCalledTimes(2)
			expect(getSchemaAppEnsuringOrganizationMock).toHaveBeenCalledTimes(1)
		})

		it('displays as appName', async () => {
			const schemaAppIdDef = await getSchemaAppIdDef()
			const buildFromUserInput = schemaAppIdDef.buildFromUserInput
			const summarizeForEdit = schemaAppIdDef.summarizeForEdit

			expect(await buildFromUserInput()).toBe('chosen-schema-app-id')

			expect(summarizeForEdit('chosen-schema-app-id')).toBe('Schema App Name')
		})

		it('falls back on endpointAppId', async () => {
			const schemaApp: SchemaApp = { userEmail: 'user@example.com', endpointAppId: 'endpoint-app-id' }
			getSchemaAppEnsuringOrganizationMock.mockResolvedValueOnce({ schemaApp, organizationWasUpdated: false })
			const schemaAppIdDef = await getSchemaAppIdDef()
			const buildFromUserInput = schemaAppIdDef.buildFromUserInput
			const summarizeForEdit = schemaAppIdDef.summarizeForEdit

			expect(await buildFromUserInput()).toBe('chosen-schema-app-id')

			expect(summarizeForEdit('chosen-schema-app-id')).toBe('endpoint-app-id')
		})

		it('falls back on "unnamed" if there is not even an endpointAppId"', async () => {
			const schemaApp: SchemaApp = { userEmail: 'user@example.com' }
			getSchemaAppEnsuringOrganizationMock.mockResolvedValueOnce({ schemaApp, organizationWasUpdated: false })
			const schemaAppIdDef = await getSchemaAppIdDef()
			const buildFromUserInput = schemaAppIdDef.buildFromUserInput
			const summarizeForEdit = schemaAppIdDef.summarizeForEdit

			expect(await buildFromUserInput()).toBe('chosen-schema-app-id')

			expect(summarizeForEdit('chosen-schema-app-id')).toBe('unnamed')
		})

		it('falls back on "none chosen" when no schema definition found', async () => {
			const schemaAppIdDef = await getSchemaAppIdDef()
			const summarizeForEdit = schemaAppIdDef.summarizeForEdit

			expect(summarizeForEdit('chosen-schema-app-id')).toBe('none chosen')
		})
	})
})
