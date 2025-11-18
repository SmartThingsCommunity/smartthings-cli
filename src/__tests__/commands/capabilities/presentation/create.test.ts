import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { CapabilitiesEndpoint, CapabilityPresentationCreate, CapabilityPresentation } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../../commands/capabilities/presentation/create.js'
import type { buildEpilog } from '../../../../lib/help.js'
import type {
	APIOrganizationCommand,
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	APIOrganizationCommandFlags,
} from '../../../../lib/command/api-organization-command.js'
import type { capabilityIdBuilder, CapabilityIdInputFlags } from '../../../../lib/command/capability-flags.js'
import type {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
} from '../../../../lib/command/input-and-output-item.js'
import type { CustomCommonOutputProducer } from '../../../../lib/command/format.js'
import type { chooseCapability } from '../../../../lib/command/util/capabilities-choose.js'
import type { buildTableOutput } from '../../../../lib/command/util/capabilities-presentation-table.js'
import { buildArgvMock, buildArgvMockStub } from '../../../test-lib/builder-mock.js'
import { tableGeneratorMock } from '../../../test-lib/table-mock.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const apiOrganizationCommandMock = jest.fn<typeof apiOrganizationCommand>()
const apiOrganizationCommandBuilderMock = jest.fn<typeof apiOrganizationCommandBuilder>()
jest.unstable_mockModule('../../../../lib/command/api-organization-command.js', () => ({
	apiOrganizationCommand: apiOrganizationCommandMock,
	apiOrganizationCommandBuilder: apiOrganizationCommandBuilderMock,
}))

const capabilityIdBuilderMock = jest.fn<typeof capabilityIdBuilder>()
jest.unstable_mockModule('../../../../lib/command/capability-flags.js', () => ({
	capabilityIdBuilder: capabilityIdBuilderMock,
}))

const inputAndOutputItemMock = jest.fn<typeof inputAndOutputItem>()
const inputAndOutputItemBuilderMock = jest.fn<typeof inputAndOutputItemBuilder>()
jest.unstable_mockModule('../../../../lib/command/input-and-output-item.js', () => ({
	inputAndOutputItem: inputAndOutputItemMock,
	inputAndOutputItemBuilder: inputAndOutputItemBuilderMock,
}))

const chooseCapabilityMock = jest.fn<typeof chooseCapability>()
jest.unstable_mockModule('../../../../lib/command/util/capabilities-choose.js', () => ({
	chooseCapability: chooseCapabilityMock,
}))

const buildTableOutputMock = jest.fn<typeof buildTableOutput>()
jest.unstable_mockModule('../../../../lib/command/util/capabilities-presentation-table.js', () => ({
	buildTableOutput: buildTableOutputMock,
}))


const {
	default: cmd,
} = await import('../../../../commands/capabilities/presentation/create.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const apiOrganizationCommandBuilderArgvMock = buildArgvMockStub<APIOrganizationCommandFlags>()
	const {
		yargsMock: capabilityIdBuilderArgvMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APIOrganizationCommandFlags & CapabilityIdInputFlags, CommandArgs>()

	apiOrganizationCommandBuilderMock.mockReturnValueOnce(apiOrganizationCommandBuilderArgvMock)
	capabilityIdBuilderMock.mockReturnValueOnce(capabilityIdBuilderArgvMock)
	inputAndOutputItemBuilderMock.mockReturnValueOnce(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiOrganizationCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(capabilityIdBuilderMock).toHaveBeenCalledExactlyOnceWith(apiOrganizationCommandBuilderArgvMock)
	expect(inputAndOutputItemBuilderMock)
		.toHaveBeenCalledExactlyOnceWith(capabilityIdBuilderArgvMock)

	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

test('handler', async () => {
	const inputArgv = {
		profile: 'default',
		id: 'id-from-cmd-line',
		capabilityVersion: 7919,
	} as ArgumentsCamelCase<CommandArgs>
	const apiCapabilitiesCreatePresentationMock = jest.fn<typeof CapabilitiesEndpoint.prototype.createPresentation>()
	const command = {
		client: {
			capabilities: {
				createPresentation: apiCapabilitiesCreatePresentationMock,
			},
		},
		tableGenerator: tableGeneratorMock,
	} as unknown as APIOrganizationCommand<ArgumentsCamelCase<CommandArgs>>
	apiOrganizationCommandMock.mockResolvedValueOnce(command)
	const chosenCapabilityId = { id: 'chosen-capability-id', version: 60 }
	chooseCapabilityMock.mockResolvedValueOnce(chosenCapabilityId)

	await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

	expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
	expect(chooseCapabilityMock).toHaveBeenCalledExactlyOnceWith(command, 'id-from-cmd-line', 7919)
	expect(inputAndOutputItemMock).toHaveBeenCalledExactlyOnceWith(
		command,
		expect.objectContaining({ buildTableOutput: expect.any(Function) }),
		expect.any(Function),
	)


	const presentation = { id: 'presentation-id' } as CapabilityPresentation
	buildTableOutputMock.mockReturnValueOnce('build table output')
	const { buildTableOutput: commandBuildTableOutput } =
		inputAndOutputItemMock.mock.calls[0][1] as CustomCommonOutputProducer<CapabilityPresentation>

	expect(commandBuildTableOutput(presentation)).toBe('build table output')

	expect(buildTableOutputMock).toHaveBeenCalledExactlyOnceWith(tableGeneratorMock, presentation)


	const createFunction = inputAndOutputItemMock.mock.calls[0][2]
	apiCapabilitiesCreatePresentationMock.mockResolvedValueOnce(presentation)
	const presentationCreate = {} as CapabilityPresentationCreate

	expect(await createFunction(undefined, presentationCreate)).toBe(presentation)

	expect(apiCapabilitiesCreatePresentationMock)
		.toHaveBeenCalledExactlyOnceWith('chosen-capability-id', 60, presentationCreate)
})
