import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { SchemaApp, SchemaEndpoint, SmartThingsClient } from '@smartthings/core-sdk'

import { CommandArgs } from '../../commands/schema.js'
import type { buildEpilog } from '../../lib/help.js'
import type {
	APIOrganizationCommand,
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	APIOrganizationCommandFlags,
} from '../../lib/command/api-organization-command.js'
import type { AllOrganizationFlags, allOrganizationsBuilder } from '../../lib/command/common-flags.js'
import { TableCommonListOutputProducer } from '../../lib/command/format.js'
import { outputItemOrList, outputItemOrListBuilder } from '../../lib/command/listing-io.js'
import { getSchemaAppEnsuringOrganization } from '../../lib/command/util/schema-util.js'
import { buildArgvMock, buildArgvMockStub } from '../test-lib/builder-mock.js'
import { tableGeneratorMock } from '../test-lib/table-mock.js'
import { ValueTableFieldDefinition } from '../../lib/table-generator.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const apiOrganizationCommandMock = jest.fn<typeof apiOrganizationCommand>()
const apiOrganizationCommandBuilderMock = jest.fn<typeof apiOrganizationCommandBuilder>()
jest.unstable_mockModule('../../lib/command/api-organization-command.js', () => ({
	apiOrganizationCommand: apiOrganizationCommandMock,
	apiOrganizationCommandBuilder: apiOrganizationCommandBuilderMock,
}))

const allOrganizationsBuilderMock = jest.fn<typeof allOrganizationsBuilder>()
jest.unstable_mockModule('../../lib/command/common-flags.js', () => ({
	allOrganizationsBuilder: allOrganizationsBuilderMock,
}))

const outputItemOrListMock =
	jest.fn<typeof outputItemOrList<SchemaApp>>()
const outputItemOrListBuilderMock = jest.fn<typeof outputItemOrListBuilder>()
jest.unstable_mockModule('../../lib/command/listing-io.js', () => ({
	outputItemOrList: outputItemOrListMock,
	outputItemOrListBuilder: outputItemOrListBuilderMock,
}))

const getSchemaAppEnsuringOrganizationMock = jest.fn<typeof getSchemaAppEnsuringOrganization>()
jest.unstable_mockModule('../../lib/command/util/schema-util.js', () => ({
	getSchemaAppEnsuringOrganization: getSchemaAppEnsuringOrganizationMock,
}))


const { default: cmd } = await import('../../commands/schema.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const apiOrganizationCommandBuilderArgvMock = buildArgvMockStub<APIOrganizationCommandFlags>()
	const {
		yargsMock: allOrganizationsBuilderArgvMock,
		positionalMock,
		optionMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APIOrganizationCommandFlags & AllOrganizationFlags, CommandArgs>()

	apiOrganizationCommandBuilderMock.mockReturnValueOnce(apiOrganizationCommandBuilderArgvMock)
	allOrganizationsBuilderMock.mockReturnValueOnce(allOrganizationsBuilderArgvMock)
	outputItemOrListBuilderMock.mockReturnValueOnce(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiOrganizationCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(allOrganizationsBuilderMock)
		.toHaveBeenCalledExactlyOnceWith(apiOrganizationCommandBuilderArgvMock)
	expect(outputItemOrListBuilderMock)
		.toHaveBeenCalledExactlyOnceWith(allOrganizationsBuilderArgvMock)

	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(optionMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const schemaApp1 = { endpointAppId: 'profile-id-1' } as SchemaApp
	const schemaApp2 = { endpointAppId: 'profile-id-2' } as SchemaApp
	const schemaAppList = [schemaApp1, schemaApp2]

	const apiSchemaListMock = jest.fn<typeof SchemaEndpoint.prototype.list>()
		.mockResolvedValue(schemaAppList)

	const clientMock = {
		schema: {
			list: apiSchemaListMock,
		},
	} as unknown as SmartThingsClient
	const command = {
		client: clientMock,
		tableGenerator: tableGeneratorMock,
	} as APIOrganizationCommand<ArgumentsCamelCase<CommandArgs>>
	apiOrganizationCommandMock.mockResolvedValue(command)

	const defaultInputArgv = {
		profile: 'default',
		verbose: false,
	} as ArgumentsCamelCase<CommandArgs>

	it('lists schema apps without args', async () => {
		await expect(cmd.handler(defaultInputArgv)).resolves.not.toThrow()

		expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(defaultInputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ primaryKeyName: 'endpointAppId' }),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		apiSchemaListMock.mockResolvedValueOnce(schemaAppList)
		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toStrictEqual([schemaApp1, schemaApp2])

		expect(apiSchemaListMock).toHaveBeenCalledExactlyOnceWith({
			includeAllOrganizations: undefined,
		})
	})

	it('lists schema apps for all organizations', async () => {
		await expect(cmd.handler({ ...defaultInputArgv, allOrganizations: true }))
			.resolves.not.toThrow()

		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toBe(schemaAppList)

		expect(apiSchemaListMock).toHaveBeenCalledExactlyOnceWith({
			includeAllOrganizations: true,
		})
	})

	it('lists details of a specified schema apps', async () => {
		const inputArgv = { ...defaultInputArgv, idOrIndex: 'argv-schema-id' }
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ primaryKeyName: 'endpointAppId' }),
			'argv-schema-id',
			expect.any(Function),
			expect.any(Function),
		)

		apiSchemaListMock.mockResolvedValueOnce(schemaAppList)
		const getFunction = outputItemOrListMock.mock.calls[0][4]
		getSchemaAppEnsuringOrganizationMock.mockResolvedValue({
			schemaApp: schemaApp1,
			organizationWasUpdated: false,
		})

		expect(await getFunction('chosen-schema-id')).toStrictEqual(schemaApp1)

		expect(getSchemaAppEnsuringOrganizationMock)
			.toHaveBeenCalledExactlyOnceWith(command, 'chosen-schema-id', inputArgv)
	})

	it('includes ARN/URL with verbose flag', async () => {
		await expect(cmd.handler({ ...defaultInputArgv, verbose: true })).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({
				listTableFieldDefinitions: expect.arrayContaining([
					{ label: 'ARN/URL', value: expect.any(Function) },
				]),
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		const config = outputItemOrListMock.mock.calls[0][1] as TableCommonListOutputProducer<SchemaApp>

		const arnValue = (config.listTableFieldDefinitions[config.listTableFieldDefinitions.length - 1] as
			ValueTableFieldDefinition<SchemaApp>).value
		expect(arnValue({ hostingType: 'lambda', lambdaArn: 'lambda-arn' } as SchemaApp)).toBe('lambda-arn')
		expect(arnValue({ hostingType: 'webhook', webhookUrl: 'webhook-url' } as SchemaApp)).toBe('webhook-url')
	})
})
