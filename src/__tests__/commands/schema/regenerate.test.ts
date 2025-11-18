import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { SchemaEndpoint, SchemaCreateResponse } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/schema/regenerate.js'
import type { buildEpilog } from '../../../lib/help.js'
import type {
	APIOrganizationCommand,
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	APIOrganizationCommandFlags,
} from '../../../lib/command/api-organization-command.js'
import type { outputItem, outputItemBuilder } from '../../../lib/command/output-item.js'
import type { chooseSchemaApp } from '../../../lib/command/util/schema-util.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'


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

const outputItemMock = jest.fn<typeof outputItem>()
const outputItemBuilderMock = jest.fn<typeof outputItemBuilder>()
jest.unstable_mockModule('../../../lib/command/output-item.js', () => ({
	outputItem: outputItemMock,
	outputItemBuilder: outputItemBuilderMock,
}))

const chooseSchemaAppMock = jest.fn<typeof chooseSchemaApp>()
jest.unstable_mockModule('../../../lib/command/util/schema-util.js', () => ({
	chooseSchemaApp: chooseSchemaAppMock,
}))


const { default: cmd } = await import('../../../commands/schema/regenerate.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiCommandBuilderArgvMock,
		positionalMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APIOrganizationCommandFlags, CommandArgs>()

	apiOrganizationCommandBuilderMock.mockReturnValue(apiCommandBuilderArgvMock)
	outputItemBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiOrganizationCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(outputItemBuilderMock).toHaveBeenCalledExactlyOnceWith(apiCommandBuilderArgvMock)
	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

test('handler', async () => {
	const apiSchemaRegenerateOauthMock = jest.fn<typeof SchemaEndpoint.prototype.regenerateOauth>()
	chooseSchemaAppMock.mockResolvedValue('chosen-schema-id')
	const command = {
		client: {
			schema: {
				regenerateOauth: apiSchemaRegenerateOauthMock,
			},
		},
	} as unknown as APIOrganizationCommand<ArgumentsCamelCase<CommandArgs>>
	apiOrganizationCommandMock.mockResolvedValue(command)

	const inputArgv = {
		profile: 'default',
		id: 'cmd-line-id',
	} as ArgumentsCamelCase<CommandArgs>

	await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

	expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
	expect(chooseSchemaAppMock).toHaveBeenCalledExactlyOnceWith(
		command,
		'cmd-line-id',
		{ promptMessage: 'Select a schema app to regenerate its client id and secret.' },
	)
	expect(outputItemMock).toHaveBeenCalledExactlyOnceWith(
		command,
		{ tableFieldDefinitions: ['endpointAppId', 'stClientId', 'stClientSecret'] },
		expect.any(Function),
	)

	const getData = outputItemMock.mock.calls[0][2]

	const updated = { endpointAppId: 'updated-schema-app-link-id' } as SchemaCreateResponse
	apiSchemaRegenerateOauthMock.mockResolvedValueOnce(updated)

	expect(await getData()).toBe(updated)

	expect(apiSchemaRegenerateOauthMock).toHaveBeenCalledExactlyOnceWith('chosen-schema-id')
})
