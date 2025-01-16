import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { CapabilitiesEndpoint, DeviceProfileTranslations, LocaleReference } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/capabilities/translations.js'
import type {
	APIOrganizationCommand,
	APIOrganizationCommandFlags,
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
} from '../../../lib/command/api-organization-command.js'
import type { capabilityIdOrIndexBuilder } from '../../../lib/command/capability-flags.js'
import type { AllOrganizationFlags } from '../../../lib/command/common-flags.js'
import type { CustomCommonOutputProducer } from '../../../lib/command/format.js'
import type {
	outputItemOrList,
	outputItemOrListBuilder,
} from '../../../lib/command/listing-io.js'
import type { chooseCapability } from '../../../lib/command/util/capabilities-choose.js'
import type { buildTableOutput } from '../../../lib/command/util/capabilities-translations-table.js'
import { apiCommandMocks } from '../../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../../test-lib/builder-mock.js'
import { tableGeneratorMock } from '../../test-lib/table-mock.js'


const { apiDocsURLMock } = apiCommandMocks('../../..')

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

const outputItemOrListMock = jest.fn<typeof outputItemOrList<DeviceProfileTranslations, LocaleReference>>()
const outputItemOrListBuilderMock = jest.fn<typeof outputItemOrListBuilder>()
jest.unstable_mockModule('../../../lib/command/listing-io.js', () => ({
	outputItemOrList: outputItemOrListMock,
	outputItemOrListBuilder: outputItemOrListBuilderMock,
}))

const chooseCapabilityMock = jest.fn<typeof chooseCapability>()
jest.unstable_mockModule('../../../lib/command/util/capabilities-choose.js', () => ({
	chooseCapability: chooseCapabilityMock,
}))

const buildTableOutputMock = jest.fn<typeof buildTableOutput>()
jest.unstable_mockModule('../../../lib/command/util/capabilities-translations-table.js', () => ({
	buildTableOutput: buildTableOutputMock,
}))


const { default: cmd } = await import('../../../commands/capabilities/translations.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const apiOrganizationCommandBuilderArgvMock = buildArgvMockStub<APIOrganizationCommandFlags>()
	const {
		yargsMock: capabilityIdOrIndexBuilderArgvMock,
		optionMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APIOrganizationCommandFlags & AllOrganizationFlags, CommandArgs>()

	apiOrganizationCommandBuilderMock.mockReturnValueOnce(apiOrganizationCommandBuilderArgvMock)
	capabilityIdOrIndexBuilderMock.mockReturnValueOnce(capabilityIdOrIndexBuilderArgvMock)
	outputItemOrListBuilderMock.mockReturnValueOnce(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiOrganizationCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(capabilityIdOrIndexBuilderMock)
		.toHaveBeenCalledExactlyOnceWith(apiOrganizationCommandBuilderArgvMock)
	expect(outputItemOrListBuilderMock)
		.toHaveBeenCalledExactlyOnceWith(capabilityIdOrIndexBuilderArgvMock)

	expect(optionMock).toHaveBeenCalledTimes(2)
	expect(epilogMock).toHaveBeenCalledTimes(1)
	expect(apiDocsURLMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
})

test('handler', async () => {
	const inputArgv = {
		profile: 'default',
		idOrIndex: 'argv-capability-id',
		capabilityVersion: 11,
		verbose: true,
		namespace: 'argv-namespace',
		tag: 'argv-tag',
	} as ArgumentsCamelCase<CommandArgs>
	const apiCapabilitiesGetTranslationsMock = jest.fn<typeof CapabilitiesEndpoint.prototype.getTranslations>()
	const apiCapabilitiesListLocalesMock = jest.fn<typeof CapabilitiesEndpoint.prototype.listLocales>()
	const command = {
		tableGenerator: tableGeneratorMock,
		client: {
			capabilities: {
				getTranslations: apiCapabilitiesGetTranslationsMock,
				listLocales: apiCapabilitiesListLocalesMock,
			},
		},
	} as unknown as APIOrganizationCommand<ArgumentsCamelCase<CommandArgs>>

	apiOrganizationCommandMock.mockResolvedValueOnce(command)
	chooseCapabilityMock.mockResolvedValueOnce({ id: 'chosen-id', version: 13 })

	await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

	expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
	expect(chooseCapabilityMock).toHaveBeenCalledExactlyOnceWith(
		command,
		'argv-capability-id',
		11,
		{ namespace: 'argv-namespace', allowIndex: true, verbose: true },
	)
	expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
		command,
		expect.objectContaining({}),
		'argv-tag',
		expect.any(Function),
		expect.any(Function),
		true,
	)

	const translations = { tag: 'es_MX' } as DeviceProfileTranslations

	buildTableOutputMock.mockReturnValueOnce('table output')
	const config = outputItemOrListMock.mock.calls[0][1] as CustomCommonOutputProducer<DeviceProfileTranslations>

	expect(config.buildTableOutput(translations)).toBe('table output')

	expect(buildTableOutputMock).toHaveBeenCalledExactlyOnceWith(tableGeneratorMock, translations)

	const listFunction = outputItemOrListMock.mock.calls[0][3]
	const locales: LocaleReference[] = [{ tag: 'en_US' }, { tag: 'fr_FR' }]
	apiCapabilitiesListLocalesMock.mockResolvedValueOnce(locales)

	expect(await listFunction()).toBe(locales)

	const getFunction = outputItemOrListMock.mock.calls[0][4]
	apiCapabilitiesGetTranslationsMock.mockResolvedValueOnce(translations)

	expect(await getFunction('no_NO')).toBe(translations)

	expect(apiCapabilitiesGetTranslationsMock).toHaveBeenCalledExactlyOnceWith('chosen-id', 13, 'no_NO')
})
