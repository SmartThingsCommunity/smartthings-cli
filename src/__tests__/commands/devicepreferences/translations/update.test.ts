import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import { DevicePreferencesEndpoint, PreferenceLocalization } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../../commands/devicepreferences/translations/update.js'
import type {
	APIOrganizationCommand,
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
	APIOrganizationCommandFlags,
} from '../../../../lib/command/api-organization-command.js'
import type {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
} from '../../../../lib/command/input-and-output-item.js'
import type { chooseDevicePreference } from '../../../../lib/command/util/devicepreferences-util.js'
import { tableFieldDefinitions } from '../../../../lib/command/util/devicepreferences/translations-util.js'
import { buildArgvMock, buildArgvMockStub } from '../../../test-lib/builder-mock.js'


const apiOrganizationCommandMock = jest.fn<typeof apiOrganizationCommand>()
const apiOrganizationCommandBuilderMock = jest.fn<typeof apiOrganizationCommandBuilder>()
jest.unstable_mockModule('../../../../lib/command/api-organization-command.js', () => ({
	apiOrganizationCommand: apiOrganizationCommandMock,
	apiOrganizationCommandBuilder: apiOrganizationCommandBuilderMock,
}))

const inputAndOutputItemMock = jest.fn<typeof inputAndOutputItem>()
const inputAndOutputItemBuilderMock = jest.fn<typeof inputAndOutputItemBuilder>()
jest.unstable_mockModule('../../../../lib/command/input-and-output-item.js', () => ({
	inputAndOutputItem: inputAndOutputItemMock,
	inputAndOutputItemBuilder: inputAndOutputItemBuilderMock,
}))

const  chooseDevicePreferenceMock = jest.fn<typeof chooseDevicePreference>()
jest.unstable_mockModule('../../../../lib/command/util/devicepreferences-util.js', () => ({
	chooseDevicePreference: chooseDevicePreferenceMock,
}))

const {
	default: cmd,
} = await import('../../../../commands/devicepreferences/translations/update.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiOrganizationCommandBuilderArgvMock,
		positionalMock,
		exampleMock,
		argvMock,
	} = buildArgvMock<APIOrganizationCommandFlags, CommandArgs>()

	apiOrganizationCommandBuilderMock.mockReturnValueOnce(apiOrganizationCommandBuilderArgvMock)
	inputAndOutputItemBuilderMock.mockReturnValueOnce(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiOrganizationCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(inputAndOutputItemBuilderMock)
		.toHaveBeenCalledExactlyOnceWith(apiOrganizationCommandBuilderArgvMock)

	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(positionalMock).toHaveBeenCalledTimes(1)
})

test('handler', async () => {
	const apiDevicePreferencesUpdateTranslationsMock =
		jest.fn<typeof DevicePreferencesEndpoint.prototype.updateTranslations>()
	const command = {
		client: {
			devicePreferences: {
				updateTranslations: apiDevicePreferencesUpdateTranslationsMock,
			},
		},
	} as unknown as APIOrganizationCommand<ArgumentsCamelCase<CommandArgs>>

	const inputArgv = {
		profile: 'default',
		id: 'cmd-line-preference',
	} as ArgumentsCamelCase<CommandArgs>

	apiOrganizationCommandMock.mockResolvedValueOnce(command)
	chooseDevicePreferenceMock.mockResolvedValueOnce('chosen-preference-id')

	await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

	expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
	expect(chooseDevicePreferenceMock).toHaveBeenCalledExactlyOnceWith(command, 'cmd-line-preference')
	expect(inputAndOutputItemMock).toHaveBeenCalledExactlyOnceWith(
		command,
		{ tableFieldDefinitions },
		expect.any(Function),
	)

	const executeAction = inputAndOutputItemMock.mock.calls[0][2]

	const translation: PreferenceLocalization = { tag: 'en', label: 'original label' }
	const updated: PreferenceLocalization = { tag: 'en', label: 'new label' }
	apiDevicePreferencesUpdateTranslationsMock.mockResolvedValueOnce(updated)

	expect(await executeAction(undefined, translation)).toBe(updated)

	expect(apiDevicePreferencesUpdateTranslationsMock)
		.toHaveBeenCalledExactlyOnceWith('chosen-preference-id', translation)
})
