import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { CapabilitiesEndpoint, Capability, OrganizationResponse, SmartThingsClient } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../commands/capabilities.js'
import type { forAllOrganizations, WithOrganization } from '../../lib/api-helpers.js'
import type { buildEpilog } from '../../lib/help.js'
import type {
	APIOrganizationCommand,
	APIOrganizationCommandFlags,
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
} from '../../lib/command/api-organization-command.js'
import type { capabilityIdOrIndexBuilder } from '../../lib/command/capability-flags.js'
import type {
	AllOrganizationFlags,
	allOrganizationsBuilder,
} from '../../lib/command/common-flags.js'
import type { CustomCommonOutputProducer } from '../../lib/command/format.js'
import type { ListDataFunction } from '../../lib/command/io-defs.js'
import type {
	outputItemOrListBuilder,
	outputItemOrListGeneric,
} from '../../lib/command/listing-io.js'
import type { buildTableOutput } from '../../lib/command/util/capabilities-table.js'
import type {
	CapabilityId,
	CapabilitySummaryWithNamespace,
	getCustomByNamespace,
	getStandard,
	translateToId,
} from '../../lib/command/util/capabilities-util.js'
import { buildArgvMock, buildArgvMockStub } from '../test-lib/builder-mock.js'
import { tableGeneratorMock } from '../test-lib/table-mock.js'


const forAllOrganizationsMock = jest.fn<typeof forAllOrganizations>()
jest.unstable_mockModule('../../lib/api-helpers.js', () => ({
	forAllOrganizations: forAllOrganizationsMock,
}))

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

const capabilityIdOrIndexBuilderMock = jest.fn<typeof capabilityIdOrIndexBuilder>()
jest.unstable_mockModule('../../lib/command/capability-flags.js', () => ({
	capabilityIdOrIndexBuilder: capabilityIdOrIndexBuilderMock,
}))

const allOrganizationsBuilderMock = jest.fn<typeof allOrganizationsBuilder>()
jest.unstable_mockModule('../../lib/command/common-flags.js', () => ({
	allOrganizationsBuilder: allOrganizationsBuilderMock,
}))

const outputItemOrListBuilderMock = jest.fn<typeof outputItemOrListBuilder>()
const outputItemOrListGenericMock = jest.fn<typeof outputItemOrListGeneric<
	CapabilityId,
	Capability,
	CapabilitySummaryWithNamespace & WithOrganization>
>()
jest.unstable_mockModule('../../lib/command/listing-io.js', () => ({
	outputItemOrListBuilder: outputItemOrListBuilderMock,
	outputItemOrListGeneric: outputItemOrListGenericMock,
}))

const buildTableOutputMock = jest.fn<typeof buildTableOutput>()
jest.unstable_mockModule('../../lib/command/util/capabilities-table.js', () => ({
	buildTableOutput: buildTableOutputMock,
}))

const getCustomByNamespaceMock = jest.fn<typeof getCustomByNamespace>()
const getStandardMock = jest.fn<typeof getStandard>()
const translateToIdMock = jest.fn<typeof translateToId>()
jest.unstable_mockModule('../../lib/command/util/capabilities-util.js', () => ({
	getCustomByNamespace: getCustomByNamespaceMock,
	getStandard: getStandardMock,
	translateToId: translateToIdMock,
}))


const { default: cmd } = await import('../../commands/capabilities.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const apiOrganizationCommandBuilderArgvMock = buildArgvMockStub<APIOrganizationCommandFlags>()
	const capabilityIdOrIndexBuilderArgvMock = buildArgvMockStub<AllOrganizationFlags>()
	const {
		yargsMock: allOrganizationsBuilderArgvMock,
		optionMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APIOrganizationCommandFlags & AllOrganizationFlags, CommandArgs>()

	apiOrganizationCommandBuilderMock.mockReturnValueOnce(apiOrganizationCommandBuilderArgvMock)
	allOrganizationsBuilderMock.mockReturnValueOnce(allOrganizationsBuilderArgvMock)
	capabilityIdOrIndexBuilderMock.mockReturnValueOnce(capabilityIdOrIndexBuilderArgvMock)
	outputItemOrListBuilderMock.mockReturnValueOnce(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiOrganizationCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(allOrganizationsBuilderMock)
		.toHaveBeenCalledExactlyOnceWith(apiOrganizationCommandBuilderArgvMock)
	expect(capabilityIdOrIndexBuilderMock)
		.toHaveBeenCalledExactlyOnceWith(allOrganizationsBuilderArgvMock)
	expect(outputItemOrListBuilderMock)
		.toHaveBeenCalledExactlyOnceWith(capabilityIdOrIndexBuilderArgvMock)

	expect(optionMock).toHaveBeenCalledTimes(2)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const apiCapabilitiesGetMock = jest.fn<typeof CapabilitiesEndpoint.prototype.get>()
	const client = {
		capabilities: {
			get: apiCapabilitiesGetMock,
		},
	} as unknown as SmartThingsClient
	const command = {
		client,
		tableGenerator: tableGeneratorMock,
	} as APIOrganizationCommand<CommandArgs>
	apiOrganizationCommandMock.mockResolvedValue(command)

	const inputArgv = { profile: 'default' } as ArgumentsCamelCase<CommandArgs>

	it('lists capabilities without args', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(outputItemOrListGenericMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({
				primaryKeyName: 'id',
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
			expect.any(Function),
		)

		const capabilities = [{ id: 'capability-id' } as CapabilitySummaryWithNamespace]
		getCustomByNamespaceMock.mockResolvedValueOnce(capabilities)
		const listFunction = outputItemOrListGenericMock.mock.calls[0][3]

		expect(await listFunction()).toBe(capabilities)

		expect(getCustomByNamespaceMock).toHaveBeenCalledExactlyOnceWith(client, undefined)

		expect(forAllOrganizationsMock).not.toHaveBeenCalled()
	})

	it('lists standard capabilities', async () => {
		await expect(cmd.handler({ ...inputArgv, standard: true })).resolves.not.toThrow()

		const capabilities = [{ id: 'standard-capability' } as CapabilitySummaryWithNamespace]
		getStandardMock.mockResolvedValueOnce(capabilities)
		const listFunction = outputItemOrListGenericMock.mock.calls[0][3]

		expect(await listFunction()).toBe(capabilities)

		expect(getStandardMock).toHaveBeenCalledExactlyOnceWith(client)

		expect(getCustomByNamespaceMock).not.toHaveBeenCalled()
		expect(forAllOrganizationsMock).not.toHaveBeenCalled()
	})

	it('lists capabilities for all organizations', async () => {
		await expect(cmd.handler({ ...inputArgv, allOrganizations: true })).resolves.not.toThrow()

		const capabilities =
			[{ id: 'capability-id' } as CapabilitySummaryWithNamespace & WithOrganization]
		forAllOrganizationsMock.mockResolvedValueOnce(capabilities)
		const listFunction = outputItemOrListGenericMock.mock.calls[0][3]

		expect(await listFunction()).toBe(capabilities)

		expect(forAllOrganizationsMock).toHaveBeenCalledExactlyOnceWith(client, expect.any(Function))

		expect(getStandardMock).not.toHaveBeenCalled()

		const listToForAll = forAllOrganizationsMock.mock.calls[0][1]

		getCustomByNamespaceMock.mockResolvedValueOnce(capabilities)
		const organizationResponse = { organizationId: 'organization-id' } as OrganizationResponse
		expect(await listToForAll(client, organizationResponse)).toBe(capabilities)

		expect(getCustomByNamespaceMock).toHaveBeenCalledExactlyOnceWith(client, undefined)
	})

	it('lists capabilities for a specified namespace', async () => {
		await expect(cmd.handler({ ...inputArgv, namespace: 'namespace' })).resolves.not.toThrow()

		const capabilities = [{ id: 'capability-id' } as CapabilitySummaryWithNamespace]
		getCustomByNamespaceMock.mockResolvedValueOnce(capabilities)
		const listFunction = outputItemOrListGenericMock.mock.calls[0][3]

		expect(await listFunction()).toBe(capabilities)

		expect(getCustomByNamespaceMock).toHaveBeenCalledExactlyOnceWith(client, 'namespace')

		expect(forAllOrganizationsMock).not.toHaveBeenCalled()
	})

	it('list details of a specific capability', async () => {
		await expect(cmd.handler({ ...inputArgv, idOrIndex: 'id-arg' })).resolves.not.toThrow()

		const translatedCapabilityId = { id: 'translated-id', version: 1 }
		// translateToIdMock mocks `translateToId` from capabilities-util
		translateToIdMock.mockResolvedValueOnce(translatedCapabilityId)
		// This is the function passed to outputItemOrListGenericMock that calls translateToIdMock.
		const translateToId = outputItemOrListGenericMock.mock.calls[0][5]
		const listFunctionMock = jest.fn<ListDataFunction<CapabilitySummaryWithNamespace>>()

		const toTranslateCapabilityId = { id: 'to-translate-id', version: 1 }
		expect(await translateToId(toTranslateCapabilityId, listFunctionMock))
			.toBe(translatedCapabilityId)

		expect(translateToIdMock)
			.toHaveBeenCalledExactlyOnceWith('id', toTranslateCapabilityId, listFunctionMock)

		const getFunction = outputItemOrListGenericMock.mock.calls[0][4]
		const capability = { id: 'final-capability' } as Capability
		apiCapabilitiesGetMock.mockResolvedValueOnce(capability)

		expect(await getFunction(translatedCapabilityId)).toBe(capability)

		expect(apiCapabilitiesGetMock).toHaveBeenCalledExactlyOnceWith('translated-id', 1)

		const buildTableOutput =
			(outputItemOrListGenericMock.mock.calls[0][1] as CustomCommonOutputProducer<Capability>)
				.buildTableOutput

		buildTableOutputMock.mockReturnValueOnce('table output')

		expect(buildTableOutput(capability)).toBe('table output')

		expect(buildTableOutputMock).toHaveBeenCalledExactlyOnceWith(tableGeneratorMock, capability)
	})

	it('handles version on command line', async () => {
		await expect(cmd.handler({ ...inputArgv, idOrIndex: 'id-arg', capabilityVersion: 2 }))
			.resolves.not.toThrow()

		expect(outputItemOrListGenericMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({}),
			{ id: 'id-arg', version: 2 },
			expect.any(Function),
			expect.any(Function),
			expect.any(Function),
		)
	})
})
