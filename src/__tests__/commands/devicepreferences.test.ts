import { jest } from '@jest/globals'
import { FunctionLike } from 'jest-mock'

import { ArgumentsCamelCase, Argv } from 'yargs'

import { DevicePreference, DevicePreferencesEndpoint, OrganizationResponse, SmartThingsClient } from '@smartthings/core-sdk'

import { WithOrganization, forAllOrganizations } from '../../lib/api-helpers.js'
import { apiDocsURL } from '../../lib/command/api-command.js'
import {
	APIOrganizationCommand,
	APIOrganizationCommandFlags,
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
} from '../../lib/command/api-organization-command.js'
import { AllOrganizationFlags, allOrganizationsBuilder } from '../../lib/command/common-flags.js'
import { OutputItemOrListFlags, outputItemOrList, outputItemOrListBuilder } from '../../lib/command/listing-io.js'
import { CommandArgs } from '../../commands/devicepreferences.js'
import { shortARNorURL, verboseApps } from '../../lib/command/util/apps-util.js'


const forAllOrganizationsMock = jest.fn<typeof forAllOrganizations>()
jest.unstable_mockModule('../../lib/api-helpers.js', () => ({
	forAllOrganizations: forAllOrganizationsMock,
}))

const apiDocsURLMock = jest.fn<typeof apiDocsURL>()
jest.unstable_mockModule('../../lib/command/api-command.js', () => ({
	apiDocsURL: apiDocsURLMock,
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

const outputItemOrListMock = jest.fn<typeof outputItemOrList<DevicePreference, DevicePreference & WithOrganization>>()
const outputItemOrListBuilderMock = jest.fn<typeof outputItemOrListBuilder>()
jest.unstable_mockModule('../../lib/command/listing-io.js', () => ({
	outputItemOrList: outputItemOrListMock,
	outputItemOrListBuilder: outputItemOrListBuilderMock,
}))

const shortARNorURLMock = jest.fn<typeof shortARNorURL>()
const verboseAppsMock = jest.fn<typeof verboseApps>()
jest.unstable_mockModule('../../lib/command/util/apps-util.js', () => ({
	shortARNorURL: shortARNorURLMock,
	verboseApps: verboseAppsMock,
	tableFieldDefinitions: [],
}))


const { default: cmd } = await import('../../commands/devicepreferences.js')

type BuilderFunctionMock<T extends FunctionLike> = jest.Mock<T> & T

test('builder', () => {
	type APIOrganizationFlags = object & APIOrganizationCommandFlags
	const apiOrganizationCommandArgvMock = jest.fn() as BuilderFunctionMock<Argv<APIOrganizationFlags>>
	apiOrganizationCommandBuilderMock.mockReturnValue(apiOrganizationCommandArgvMock)

	type AllOrganizationReturnFlags = APIOrganizationFlags & AllOrganizationFlags
	const allOrganizationsBuilderArgvMock = jest.fn() as BuilderFunctionMock<Argv<AllOrganizationReturnFlags>>
	allOrganizationsBuilderMock.mockReturnValue(allOrganizationsBuilderArgvMock)

	type OutputItemOrListReturnFlags = AllOrganizationReturnFlags & OutputItemOrListFlags
	const outputItemOrListArgvMock = jest.fn() as BuilderFunctionMock<Argv<OutputItemOrListReturnFlags>>

	const positionalMock = jest.fn() as BuilderFunctionMock<Argv<OutputItemOrListReturnFlags>['positional']>
	positionalMock.mockReturnValue(outputItemOrListArgvMock)
	outputItemOrListArgvMock.positional = positionalMock

	const optionMock = jest.fn() as BuilderFunctionMock<Argv<OutputItemOrListReturnFlags>['option']>
	optionMock.mockReturnValue(outputItemOrListArgvMock)
	outputItemOrListArgvMock.option = optionMock

	const exampleMock = jest.fn() as BuilderFunctionMock<Argv<OutputItemOrListReturnFlags>['example']>
	exampleMock.mockReturnValue(outputItemOrListArgvMock)
	outputItemOrListArgvMock.example = exampleMock

	const epilogMock = jest.fn() as BuilderFunctionMock<Argv<OutputItemOrListReturnFlags>['epilog']>
	epilogMock.mockReturnValue(outputItemOrListArgvMock)
	outputItemOrListArgvMock.epilog = epilogMock

	outputItemOrListBuilderMock.mockReturnValue(outputItemOrListArgvMock)

	type CommandFlags = APIOrganizationCommandFlags & { testOption?: string }
	const yargsMock = jest.fn() as jest.Mock<Argv<CommandFlags>> & Argv<CommandFlags>

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(outputItemOrListArgvMock)

	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(optionMock).toHaveBeenCalledTimes(2)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const standardPreference1 = { preferenceId: 'humidityOffset' } as DevicePreference & WithOrganization
	const standardPreference2 = { preferenceId: 'motionSensitivity' } as DevicePreference & WithOrganization
	const userPreference1 = { preferenceId: 'bunnyslow96234.myPreference1' } as DevicePreference & WithOrganization
	const userPreference2 = { preferenceId: 'turtlefast96234.myPreference1' } as DevicePreference & WithOrganization
	const preferenceList = [standardPreference1, standardPreference2, userPreference1, userPreference2]

	const apiPreferencesListMock = jest.fn<typeof DevicePreferencesEndpoint.prototype.list>()
		.mockResolvedValue(preferenceList)
	const apiPreferencesGetMock = jest.fn<typeof DevicePreferencesEndpoint.prototype.get>()

	const clientMock = {
		devicePreferences: {
			list: apiPreferencesListMock,
			get: apiPreferencesGetMock,
		},
	} as unknown as SmartThingsClient
	const command = {
		client: clientMock,
	} as APIOrganizationCommand<ArgumentsCamelCase<CommandArgs>>
	apiOrganizationCommandMock.mockResolvedValue(command)

	const defaultInputArgv = {
		profile: 'default',
		standard: false,
	} as ArgumentsCamelCase<CommandArgs>

	it('lists user device preferences without args', async () => {
		await expect(cmd.handler(defaultInputArgv)).resolves.not.toThrow()

		expect(apiOrganizationCommandMock).toHaveBeenCalledTimes(1)
		expect(apiOrganizationCommandMock).toHaveBeenCalledWith(defaultInputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			command,
			expect.objectContaining({ primaryKeyName: 'preferenceId' }),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		apiPreferencesListMock.mockResolvedValueOnce(preferenceList)
		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toStrictEqual([userPreference1, userPreference2])

		expect(apiPreferencesListMock).toHaveBeenCalledTimes(1)
		expect(apiPreferencesListMock).toHaveBeenCalledWith()
	})

	it('lists standard preferences without --standard option', async () => {
		await expect(cmd.handler({
			...defaultInputArgv,
			standard: true,
		})).resolves.not.toThrow()

		apiPreferencesListMock.mockResolvedValueOnce(preferenceList)
		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toStrictEqual([standardPreference1, standardPreference2])
	})

	it('lists preferences from a specified namespace', async () => {
		await expect(cmd.handler({
			...defaultInputArgv,
			namespace: 'turtlefast96234.myPreference1',
		})).resolves.not.toThrow()

		apiPreferencesListMock.mockResolvedValueOnce([userPreference2])
		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toStrictEqual([userPreference2])

		expect(apiPreferencesListMock).toHaveBeenCalledTimes(1)
		expect(apiPreferencesListMock).toHaveBeenCalledWith('turtlefast96234.myPreference1')
	})

	it('lists preferences for all organizations', async () => {
		await expect(cmd.handler({
			...defaultInputArgv,
			allOrganizations: true,
		})).resolves.not.toThrow()

		const listFunction = outputItemOrListMock.mock.calls[0][3]
		forAllOrganizationsMock.mockResolvedValueOnce(preferenceList)

		expect(await listFunction()).toBe(preferenceList)

		expect(apiPreferencesListMock).toHaveBeenCalledTimes(0)
		expect(forAllOrganizationsMock).toHaveBeenCalledTimes(1)
		expect(forAllOrganizationsMock).toHaveBeenCalledWith(clientMock, expect.any(Function))

		const perOrgQuery = forAllOrganizationsMock.mock.calls[0][1]

		const organization = { name: 'Organization Name' } as OrganizationResponse
		expect(await perOrgQuery(clientMock, organization)).toBe(preferenceList)

		expect(apiPreferencesListMock).toHaveBeenCalledTimes(1)
		expect(apiPreferencesListMock).toHaveBeenCalledWith('Organization Name')
	})

	it('lists details of a specified device preference', async () => {
		const inputArgv = {
			...defaultInputArgv,
			idOrIndex: 'device-preference-from-cmd-line',
		}
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiOrganizationCommandMock).toHaveBeenCalledTimes(1)
		expect(apiOrganizationCommandMock).toHaveBeenCalledWith(inputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListMock).toHaveBeenCalledWith(
			command,
			expect.objectContaining({ primaryKeyName: 'preferenceId' }),
			'device-preference-from-cmd-line',
			expect.any(Function),
			expect.any(Function),
		)

		apiPreferencesListMock.mockResolvedValueOnce(preferenceList)
		const getFunction = outputItemOrListMock.mock.calls[0][4]
		apiPreferencesGetMock.mockResolvedValue(userPreference1)

		expect(await getFunction('chosen-device-preference-id')).toStrictEqual(userPreference1)

		expect(apiPreferencesGetMock).toHaveBeenCalledTimes(1)
		expect(apiPreferencesGetMock).toHaveBeenCalledWith('chosen-device-preference-id')
	})
})
