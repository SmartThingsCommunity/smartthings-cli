import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { CapabilitiesEndpoint, SmartThingsClient, CapabilityPresentation } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/capabilities/presentation.js'
import type { buildEpilog } from '../../../lib/help.js'
import type {
	APIOrganizationCommand,
	APIOrganizationCommandFlags,
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
} from '../../../lib/command/api-organization-command.js'
import type {
	capabilityIdOrIndexBuilder,
	CapabilityIdOrIndexInputFlags,
} from '../../../lib/command/capability-flags.js'
import type { CustomCommonOutputProducer, formatAndWriteItem, formatAndWriteItemBuilder } from '../../../lib/command/format.js'
import { chooseCapability } from '../../../lib/command/util/capabilities-choose.js'
import { buildTableOutput } from '../../../lib/command/util/capabilities-presentation-table.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'
import { tableGeneratorMock } from '../../test-lib/table-mock.js'


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

const capabilityIdOrIndexBuilderMock = jest.fn<typeof capabilityIdOrIndexBuilder>()
jest.unstable_mockModule('../../../lib/command/capability-flags.js', () => ({
	capabilityIdOrIndexBuilder: capabilityIdOrIndexBuilderMock,
}))

const formatAndWriteItemMock = jest.fn<typeof formatAndWriteItem<CapabilityPresentation>>()
const formatAndWriteItemBuilderMock = jest.fn<typeof formatAndWriteItemBuilder>()
jest.unstable_mockModule('../../../lib/command/format.js', () => ({
	formatAndWriteItem: formatAndWriteItemMock,
	formatAndWriteItemBuilder: formatAndWriteItemBuilderMock,
}))

const chooseCapabilityMock = jest.fn<typeof chooseCapability>()
jest.unstable_mockModule('../../../lib/command/util/capabilities-choose.js', () => ({
	chooseCapability: chooseCapabilityMock,
}))

const buildTableOutputMock = jest.fn<typeof buildTableOutput>()
jest.unstable_mockModule('../../../lib/command/util/capabilities-presentation-table.js', () => ({
	buildTableOutput: buildTableOutputMock,
}))



const {
	default: cmd,
} = await import('../../../commands/capabilities/presentation.js')

test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const apiOrganizationCommandBuilderArgvMock = buildArgvMockStub<APIOrganizationCommandFlags>()
	const {
		yargsMock: capabilityIdOrIndexBuilderArgvMock,
		optionMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APIOrganizationCommandFlags & CapabilityIdOrIndexInputFlags, CommandArgs>()

	apiOrganizationCommandBuilderMock.mockReturnValueOnce(apiOrganizationCommandBuilderArgvMock)
	capabilityIdOrIndexBuilderMock.mockReturnValueOnce(capabilityIdOrIndexBuilderArgvMock)
	formatAndWriteItemBuilderMock.mockReturnValueOnce(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiOrganizationCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(capabilityIdOrIndexBuilderMock).toHaveBeenCalledExactlyOnceWith(apiOrganizationCommandBuilderArgvMock)
	expect(formatAndWriteItemBuilderMock).toHaveBeenCalledExactlyOnceWith(capabilityIdOrIndexBuilderArgvMock)

	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(optionMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const presentation: CapabilityPresentation = { id: 'capability-id', version: 7 }
	const apiCapabilitiesGetPresentationMock = jest.fn<typeof CapabilitiesEndpoint.prototype.getPresentation>()
		.mockResolvedValue(presentation)
	const client = { capabilities: {
		getPresentation: apiCapabilitiesGetPresentationMock,
	} } as unknown as SmartThingsClient
	const command = {
		client,
		tableGenerator: tableGeneratorMock,
	} as APIOrganizationCommand<ArgumentsCamelCase<CommandArgs>>
	apiOrganizationCommandMock.mockResolvedValue(command)
	chooseCapabilityMock.mockResolvedValue({ id: 'chosen-id', version: 3 })

	const defaultInputArgv = {
		profile: 'default',
	} as ArgumentsCamelCase<CommandArgs>

	it('queries user for capabilityId and displays info', async () => {
		await expect(cmd.handler(defaultInputArgv)).resolves.not.toThrow()

		expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(defaultInputArgv)
		expect(chooseCapabilityMock)
			.toHaveBeenCalledExactlyOnceWith(command, undefined, undefined, { allowIndex: true })
		expect(apiCapabilitiesGetPresentationMock).toHaveBeenCalledExactlyOnceWith('chosen-id', 3)
		expect(formatAndWriteItemMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ buildTableOutput: expect.any(Function) }),
			presentation,
		)

		buildTableOutputMock.mockReturnValueOnce('table output')

		const buildTableOutput =
			(formatAndWriteItemMock.mock.calls[0][1] as CustomCommonOutputProducer<CapabilityPresentation>)
				.buildTableOutput

		expect(buildTableOutput(presentation)).toBe('table output')

		expect(buildTableOutputMock).toHaveBeenCalledExactlyOnceWith(tableGeneratorMock, presentation)
	})

	it('uses capability id specified on command line', async () => {
		await expect(cmd.handler({
			...defaultInputArgv,
			idOrIndex: 'cmd-line-id',
			capabilityVersion: 13,
			namespace: 'namespace',
		})).resolves.not.toThrow()

		expect(chooseCapabilityMock).toHaveBeenCalledExactlyOnceWith(
			command,
			'cmd-line-id',
			13,
			{ namespace: 'namespace', allowIndex: true },
		)
	})
})
