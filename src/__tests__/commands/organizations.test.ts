import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type {
	OrganizationResponse,
	OrganizationsEndpoint,
	SmartThingsClient,
} from '@smartthings/core-sdk'

import type { APICommand, APICommandFlags } from '../../lib/command/api-command.js'
import type { outputItemOrList, outputItemOrListBuilder } from '../../lib/command/listing-io.js'
import type { CommandArgs } from '../../commands/organizations.js'
import type { BuildOutputFormatterFlags } from '../../lib/command/output-builder.js'
import type { SmartThingsCommandFlags } from '../../lib/command/smartthings-command.js'
import { apiCommandMocks } from '../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../test-lib/builder-mock.js'


const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks('../..')

const outputItemOrListMock = jest.fn<typeof outputItemOrList<OrganizationResponse>>()
const outputItemOrListBuilderMock = jest.fn<typeof outputItemOrListBuilder>()
jest.unstable_mockModule('../../lib/command/listing-io.js', () => ({
	outputItemOrList: outputItemOrListMock,
	outputItemOrListBuilder: outputItemOrListBuilderMock,
}))


const { default: cmd } = await import('../../commands/organizations.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiCommandBuilderArgvMock,
		positionalMock,
		exampleMock,
		argvMock,
	} = buildArgvMock<SmartThingsCommandFlags, BuildOutputFormatterFlags>()

	apiCommandBuilderMock.mockReturnValue(apiCommandBuilderArgvMock)
	outputItemOrListBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(outputItemOrListBuilderMock).toHaveBeenCalledExactlyOnceWith(apiCommandBuilderArgvMock)
	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const organization = { organizationId: 'organization-id' } as OrganizationResponse
	const organizationList = [{ organizationId: 'paged-organization-id' }] as OrganizationResponse[]

	const apiOrganizationsListMock = jest.fn<typeof OrganizationsEndpoint.prototype.list>()
		.mockResolvedValue(organizationList)
	const apiOrganizationsGetMock = jest.fn<typeof OrganizationsEndpoint.prototype.get>()
		.mockResolvedValue(organization)
	const clientMock = {
		organizations: {
			list: apiOrganizationsListMock,
			get: apiOrganizationsGetMock,
		},
	} as unknown as SmartThingsClient
	const command = {
		client: clientMock,
	} as APICommand<APICommandFlags>
	apiCommandMock.mockResolvedValue(command)

	const defaultInputArgv = {
		profile: 'default',
	} as ArgumentsCamelCase<CommandArgs>

	it('lists organizations without args', async () => {
		await expect(cmd.handler(defaultInputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(defaultInputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ primaryKeyName: 'organizationId' }),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		apiOrganizationsListMock.mockResolvedValueOnce(organizationList)
		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toStrictEqual(organizationList)

		expect(apiOrganizationsListMock).toHaveBeenCalledExactlyOnceWith()
	})

	it('lists details of a specified organization', async () => {
		const inputArgv = {
			...defaultInputArgv,
			idOrIndex: 'organization-from-arg',
		} as ArgumentsCamelCase<CommandArgs>

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ primaryKeyName: 'organizationId' }),
			'organization-from-arg',
			expect.any(Function),
			expect.any(Function),
		)

		const getFunction = outputItemOrListMock.mock.calls[0][4]

		expect(await getFunction('chosen-organization-id')).toStrictEqual(organization)

		expect(apiOrganizationsGetMock).toHaveBeenCalledExactlyOnceWith('chosen-organization-id')
	})
})
