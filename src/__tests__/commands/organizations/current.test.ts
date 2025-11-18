import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type {
	OrganizationResponse,
	OrganizationsEndpoint,
	SmartThingsClient,
} from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/organizations/current.js'
import type { buildEpilog } from '../../../lib/help.js'
import type {
	APIOrganizationCommand,
	APIOrganizationCommandFlags,
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
} from '../../../lib/command/api-organization-command.js'
import type {
	formatAndWriteItem,
	formatAndWriteItemBuilder,
} from '../../../lib/command/format.js'
import {
	tableFieldDefinitions,
} from '../../../lib/command/util/organizations-util.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'
import { CLIConfig } from '../../../lib/cli-config.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const apiOrganizationCommandMock = jest.fn<typeof apiOrganizationCommand>()
const apiOrganizationCommandBuilderMock = jest.fn<typeof apiOrganizationCommandBuilder>()
jest.unstable_mockModule('../../../lib/command/api-organization-command.js', () => ({
	apiOrganizationCommand: apiOrganizationCommandMock,
	apiOrganizationCommandBuilder: apiOrganizationCommandBuilderMock,
}))

const formatAndWriteItemMock = jest.fn<typeof formatAndWriteItem>()
const formatAndWriteItemBuilderMock = jest.fn<typeof formatAndWriteItemBuilder>()
jest.unstable_mockModule('../../../lib/command/format.js', () => ({
	formatAndWriteItem: formatAndWriteItemMock,
	formatAndWriteItemBuilder: formatAndWriteItemBuilderMock,
}))

jest.unstable_mockModule('../../../lib/command/util/organizations-util.js', () => ({
	tableFieldDefinitions,
}))

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { /*no-op*/ })


const {
	default: cmd,
} = await import('../../../commands/organizations/current.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiOrganizationCommandBuilderArgvMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APIOrganizationCommandFlags, CommandArgs>()

	apiOrganizationCommandBuilderMock.mockReturnValueOnce(apiOrganizationCommandBuilderArgvMock)
	formatAndWriteItemBuilderMock.mockReturnValueOnce(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiOrganizationCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(formatAndWriteItemBuilderMock)
		.toHaveBeenCalledExactlyOnceWith(apiOrganizationCommandBuilderArgvMock)

	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const organization1 = { organizationId: 'organization-id-1' } as OrganizationResponse
	const organization2 = { organizationId: 'organization-id-2' } as OrganizationResponse
	const defaultOrganization = {
		organizationId: 'default-organization-id',
		isDefaultUserOrg: true,
	} as OrganizationResponse
	const organizationList = [organization1, organization2, defaultOrganization] as OrganizationResponse[]

	const apiOrganizationsGetMock = jest.fn<typeof OrganizationsEndpoint.prototype.get>()
		.mockResolvedValue(organization2)
	const apiOrganizationsListMock = jest.fn<typeof OrganizationsEndpoint.prototype.list>()
		.mockResolvedValue(organizationList)
	const clientMock = {
		organizations: {
			get: apiOrganizationsGetMock,
			list: apiOrganizationsListMock,
		},
	} as unknown as SmartThingsClient
	const stringConfigValueMock = jest.fn<CLIConfig['stringConfigValue']>()
		.mockReturnValue(undefined)
	const cliConfigMock = {
		stringConfigValue: stringConfigValueMock,
	} as unknown as CLIConfig
	const command = {
		client: clientMock,
		cliConfig: cliConfigMock,
	} as APIOrganizationCommand<ArgumentsCamelCase<CommandArgs>>
	apiOrganizationCommandMock.mockResolvedValue(command)

	const inputArgv = {
		profile: 'default',
	} as unknown as ArgumentsCamelCase<CommandArgs>

	it('finds user default organization', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(apiOrganizationsListMock).toHaveBeenCalledExactlyOnceWith()
		expect(formatAndWriteItemMock)
			.toHaveBeenCalledExactlyOnceWith(command, { tableFieldDefinitions }, defaultOrganization)

		expect(apiOrganizationsGetMock).not.toHaveBeenCalled()
	})

	it('displays configured default organization', async () => {
		stringConfigValueMock.mockReturnValueOnce('config-organization-id')

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(apiOrganizationsGetMock).toHaveBeenCalledExactlyOnceWith('config-organization-id')
		expect(formatAndWriteItemMock)
			.toHaveBeenCalledExactlyOnceWith(command, { tableFieldDefinitions }, organization2)

		expect(apiOrganizationsListMock).not.toHaveBeenCalled()
	})

	it('displays proper error message when a configured organization does not exist', async () => {
		stringConfigValueMock.mockReturnValueOnce('config-organization-id')
		apiOrganizationsGetMock.mockRejectedValueOnce({ response: { status: 403 } })

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(apiOrganizationsGetMock).toHaveBeenCalledExactlyOnceWith('config-organization-id')
		expect(consoleErrorSpy).toHaveBeenCalledWith('Organization \'config-organization-id\' not found')

		expect(apiOrganizationsListMock).not.toHaveBeenCalled()
		expect(formatAndWriteItemMock).not.toHaveBeenCalled()
	})

	it('displays proper error message when no default organization configured or found', async () => {
		apiOrganizationsListMock.mockResolvedValueOnce([organization1, organization2])

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(consoleErrorSpy).toHaveBeenCalledWith('Could not find an active organization.')

		expect(apiOrganizationsGetMock).not.toHaveBeenCalled()
		expect(formatAndWriteItemMock).not.toHaveBeenCalled()
	})

	it('rethrows unexpected error getting organization', async () => {
		stringConfigValueMock.mockReturnValueOnce('config-organization-id')
		apiOrganizationsGetMock.mockRejectedValueOnce(Error('some bad thing happened'))

		await expect(cmd.handler(inputArgv)).rejects.toThrow('some bad thing happened')

		expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(apiOrganizationsGetMock).toHaveBeenCalledExactlyOnceWith('config-organization-id')

		expect(apiOrganizationsListMock).not.toHaveBeenCalled()
		expect(formatAndWriteItemMock).not.toHaveBeenCalled()
	})
})
