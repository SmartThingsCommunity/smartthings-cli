import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import { DevicePreferencesEndpoint, LocaleReference, PreferenceLocalization } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/devicepreferences/translations.js'
import type { buildEpilog } from '../../../lib/help.js'
import type {
	APIOrganizationCommand,
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	APIOrganizationCommandFlags,
} from '../../../lib/command/api-organization-command.js'
import type {
	outputItemOrList,
	outputItemOrListBuilder,
	OutputItemOrListFlags,
} from '../../../lib/command/listing-io.js'
import { chooseDevicePreference } from '../../../lib/command/util/devicepreferences-util.js'
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

const outputItemOrListMock = jest.fn<typeof outputItemOrList<PreferenceLocalization, LocaleReference>>()
const outputItemOrListBuilderMock = jest.fn<typeof outputItemOrListBuilder>()
jest.unstable_mockModule('../../../lib/command/listing-io.js', () => ({
	outputItemOrList: outputItemOrListMock,
	outputItemOrListBuilder: outputItemOrListBuilderMock,
}))

const chooseDevicePreferenceMock = jest.fn<typeof chooseDevicePreference>()
jest.unstable_mockModule('../../../lib/command/util/devicepreferences-util.js', () => ({
	chooseDevicePreference: chooseDevicePreferenceMock,
}))


const { default: cmd } = await import('../../../commands/devicepreferences/translations.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiOrganizationCommandBuilderArgvMock,
		positionalMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APIOrganizationCommandFlags, OutputItemOrListFlags>()

	apiOrganizationCommandBuilderMock.mockReturnValue(apiOrganizationCommandBuilderArgvMock)
	outputItemOrListBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiOrganizationCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(outputItemOrListBuilderMock).toHaveBeenCalledExactlyOnceWith(apiOrganizationCommandBuilderArgvMock)
	expect(positionalMock).toHaveBeenCalledTimes(2)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const apiDevicePreferencesGetTranslationsMock =
		jest.fn<typeof DevicePreferencesEndpoint.prototype.getTranslations>()
	const apiDevicePreferencesListTranslationsMock =
		jest.fn<typeof DevicePreferencesEndpoint.prototype.listTranslations>()
	const command = {
		client: {
			devicePreferences: {
				getTranslations: apiDevicePreferencesGetTranslationsMock,
				listTranslations: apiDevicePreferencesListTranslationsMock,
			},
		},
	} as unknown as APIOrganizationCommand<ArgumentsCamelCase<CommandArgs>>

	const baseInputArgv = { profile: 'default' } as ArgumentsCamelCase<CommandArgs>

	it('lists translations for a preference when no tag specified', async () => {
		apiOrganizationCommandMock.mockResolvedValueOnce(command)
		chooseDevicePreferenceMock.mockResolvedValueOnce('chosen-preference-id')

		await expect(cmd.handler(baseInputArgv)).resolves.not.toThrow()

		expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(baseInputArgv)
		expect(chooseDevicePreferenceMock).toHaveBeenCalledExactlyOnceWith(command, undefined)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ primaryKeyName: 'tag' }),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		const listTranslations = outputItemOrListMock.mock.calls[0][3]
		const locales: LocaleReference[] = [{ tag: 'en_US' }, { tag: 'es_ES' }]
		apiDevicePreferencesListTranslationsMock.mockResolvedValueOnce(locales)

		expect(await listTranslations()).toBe(locales)

		expect(apiDevicePreferencesListTranslationsMock).toHaveBeenCalledExactlyOnceWith('chosen-preference-id')
	})

	it('displays translation details with a tag', async () => {
		const inputArgv = {
			...baseInputArgv,
			preferenceIdOrIndex: 'cmd-line-preference-id',
			tag: 'cmd-line-tag',
		}
		apiOrganizationCommandMock.mockResolvedValueOnce(command)
		chooseDevicePreferenceMock.mockResolvedValueOnce('chosen-preference-id')

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(chooseDevicePreferenceMock).toHaveBeenCalledExactlyOnceWith(command, 'cmd-line-preference-id')
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ primaryKeyName: 'tag' }),
			'cmd-line-tag',
			expect.any(Function),
			expect.any(Function),
		)

		const getTranslation = outputItemOrListMock.mock.calls[0][4]
		const preferenceLocalization: PreferenceLocalization = { tag: 'es_GT', label: 'label' }
		apiDevicePreferencesGetTranslationsMock.mockResolvedValueOnce(preferenceLocalization)

		expect(await getTranslation('specified-tag')).toBe(preferenceLocalization)

		expect(apiDevicePreferencesGetTranslationsMock)
			.toHaveBeenCalledExactlyOnceWith('chosen-preference-id', 'specified-tag')
	})
})
