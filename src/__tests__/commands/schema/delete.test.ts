import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { SchemaEndpoint, SmartThingsClient } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/schema/delete.js'
import type {
	APIOrganizationCommand,
	APIOrganizationCommandFlags,
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
} from '../../../lib/command/api-organization-command.js'
import type { chooseSchemaApp } from '../../../lib/command/util/schema-util.js'
import { apiCommandMocks } from '../../test-lib/api-command-mock.js'
import { buildArgvMock } from '../../test-lib/builder-mock.js'


const { apiDocsURLMock } = apiCommandMocks('../../..')

const apiOrganizationCommandMock = jest.fn<typeof apiOrganizationCommand>()
const apiOrganizationCommandBuilderMock = jest.fn<typeof apiOrganizationCommandBuilder>()
jest.unstable_mockModule('../../../lib/command/api-organization-command.js', () => ({
	apiOrganizationCommand: apiOrganizationCommandMock,
	apiOrganizationCommandBuilder: apiOrganizationCommandBuilderMock,
}))

const chooseSchemaAppMock = jest.fn<typeof chooseSchemaApp>()
jest.unstable_mockModule('../../../lib/command/util/schema-util.js', () => ({
	chooseSchemaApp: chooseSchemaAppMock,
}))

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /*no-op*/ })


const { default: cmd } = await import('../../../commands/schema/delete.js')


test('builder', () => {
	const {
		yargsMock,
		positionalMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<object, CommandArgs>()

	apiOrganizationCommandBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>
	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiOrganizationCommandBuilderMock).toHaveBeenCalledTimes(1)
	expect(apiOrganizationCommandBuilderMock).toHaveBeenCalledWith(yargsMock)

	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(apiDocsURLMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

test('handler', async () => {
	const apiSchemaDeleteMock = jest.fn<typeof SchemaEndpoint.prototype.delete>()
	chooseSchemaAppMock.mockResolvedValueOnce('chosen-schema-id')
	const clientMock = {
		schema: {
			delete: apiSchemaDeleteMock,
		},
	} as unknown as SmartThingsClient
	const command = {
		client: clientMock,
	} as APIOrganizationCommand<APIOrganizationCommandFlags>
	apiOrganizationCommandMock.mockResolvedValue(command)
	const inputArgv = { profile: 'default', id: 'command-line-id' } as ArgumentsCamelCase<CommandArgs>

	await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

	expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
	expect(chooseSchemaAppMock).toHaveBeenCalledExactlyOnceWith(
		command,
		'command-line-id',
		{ promptMessage: 'Select a Schema App to delete.' },
	)
	expect(apiSchemaDeleteMock).toHaveBeenCalledExactlyOnceWith('chosen-schema-id')

	expect(consoleLogSpy).toHaveBeenLastCalledWith('Schema App link chosen-schema-id deleted.')
})
