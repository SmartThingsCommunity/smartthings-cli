import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type {
	DevicePreferencesEndpoint,
	PreferenceLocalization,
	SmartThingsClient,
} from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../../commands/devicepreferences/translations/create.js'
import type {
	APIOrganizationCommand,
	APIOrganizationCommandFlags,
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
} from '../../../../lib/command/api-organization-command.js'
import type {
	inputAndOutputItem,
	inputAndOutputItemBuilder,
} from '../../../../lib/command/input-and-output-item.js'
import type { chooseDevicePreference } from '../../../../lib/command/util/devicepreferences-util.js'
import {
	tableFieldDefinitions,
} from '../../../../lib/command/util/devicepreferences/translations-util.js'
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
} = await import('../../../../commands/devicepreferences/translations/create.js')


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
	const apiDevicePreferencesCreateTranslationsMock =
		jest.fn<typeof DevicePreferencesEndpoint.prototype['createTranslations']>()

	const clientMock = {
		devicePreferences: {
			createTranslations: apiDevicePreferencesCreateTranslationsMock,
		},
	} as unknown as SmartThingsClient
	const command = {
		client: clientMock,
	} as APIOrganizationCommand<CommandArgs>
	apiOrganizationCommandMock.mockResolvedValueOnce(command)
	chooseDevicePreferenceMock.mockResolvedValueOnce('chosen-id')

	const inputArgv = {
		profile: 'default',
		devicePreferenceId: 'argv-id',
	} as unknown as ArgumentsCamelCase<CommandArgs>
	await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

	expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
	expect(chooseDevicePreferenceMock).toHaveBeenCalledExactlyOnceWith(command, 'argv-id')
	expect(inputAndOutputItemMock).toHaveBeenCalledExactlyOnceWith(
		command,
		{ tableFieldDefinitions },
		expect.any(Function),
	)

	const create = inputAndOutputItemMock.mock.calls[0][2]

	const translationCreate = { description: 'Translation To Create' } as PreferenceLocalization
	const createdTranslation = { description: 'Created Translation' } as PreferenceLocalization

	apiDevicePreferencesCreateTranslationsMock.mockResolvedValueOnce(createdTranslation)

	expect(await create(undefined, translationCreate)).toBe(createdTranslation)

	expect(apiDevicePreferencesCreateTranslationsMock)
		.toHaveBeenCalledExactlyOnceWith('chosen-id', translationCreate)
})
