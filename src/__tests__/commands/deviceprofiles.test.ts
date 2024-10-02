import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type {
	DeviceProfile,
	DeviceProfilesEndpoint,
	OrganizationResponse,
	SmartThingsClient,
} from '@smartthings/core-sdk'

import type { CommandArgs } from '../../commands/deviceprofiles.js'
import type { WithOrganization, forAllOrganizations } from '../../lib/api-helpers.js'
import type { apiDocsURL } from '../../lib/command/api-command.js'
import type {
	APIOrganizationCommand,
	APIOrganizationCommandFlags,
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
} from '../../lib/command/api-organization-command.js'
import type {
	AllOrganizationFlags,
	allOrganizationsBuilder,
} from '../../lib/command/common-flags.js'
import type {
	CustomCommonOutputProducer,
	TableCommonListOutputProducer,
} from '../../lib/command/format.js'
import type { outputItemOrList, outputItemOrListBuilder } from '../../lib/command/listing-io.js'
import type { ValueTableFieldDefinition } from '../../lib/table-generator.js'
import type { shortARNorURL, verboseApps } from '../../lib/command/util/apps-util.js'
import type { buildTableOutput } from '../../lib/command/util/deviceprofiles-util.js'
import { buildArgvMock, buildArgvMockStub } from '../test-lib/builder-mock.js'
import { tableGeneratorMock } from '../test-lib/table-mock.js'


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

const outputItemOrListMock =
	jest.fn<typeof outputItemOrList<DeviceProfile, DeviceProfile & WithOrganization>>()
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

const buildTableOutputMock = jest.fn<typeof buildTableOutput>()
jest.unstable_mockModule('../../lib/command/util/deviceprofiles-util.js', () => ({
	buildTableOutput: buildTableOutputMock,
}))


const { default: cmd } = await import('../../commands/deviceprofiles.js')


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
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const deviceProfile1 = { id: 'profile-id-1' } as DeviceProfile & WithOrganization
	const deviceProfile2 = { id: 'profile-id-2' } as DeviceProfile & WithOrganization
	const profileList = [deviceProfile1, deviceProfile2]

	const apiProfilesListMock = jest.fn<typeof DeviceProfilesEndpoint.prototype.list>()
		.mockResolvedValue(profileList)
	const apiProfilesGetMock = jest.fn<typeof DeviceProfilesEndpoint.prototype.get>()

	const clientMock = {
		deviceProfiles: {
			list: apiProfilesListMock,
			get: apiProfilesGetMock,
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
		idOrIndex: 'argv-profile-id',
	} as ArgumentsCamelCase<CommandArgs>

	it('lists user device profiles without args', async () => {
		await expect(cmd.handler(defaultInputArgv)).resolves.not.toThrow()

		expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(defaultInputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ primaryKeyName: 'id' }),
			'argv-profile-id',
			expect.any(Function),
			expect.any(Function),
		)

		apiProfilesListMock.mockResolvedValueOnce(profileList)
		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toStrictEqual([deviceProfile1, deviceProfile2])

		expect(apiProfilesListMock).toHaveBeenCalledExactlyOnceWith()
	})

	it('lists profiles for all organizations', async () => {
		await expect(cmd.handler({ ...defaultInputArgv, allOrganizations: true }))
			.resolves.not.toThrow()

		const listFunction = outputItemOrListMock.mock.calls[0][3]
		forAllOrganizationsMock.mockResolvedValueOnce(profileList)

		expect(await listFunction()).toBe(profileList)

		expect(apiProfilesListMock).not.toHaveBeenCalled()
		expect(forAllOrganizationsMock)
			.toHaveBeenCalledExactlyOnceWith(clientMock, expect.any(Function))

		const perOrgQuery = forAllOrganizationsMock.mock.calls[0][1]

		const organization = { name: 'Organization Name' } as OrganizationResponse
		expect(await perOrgQuery(clientMock, organization)).toBe(profileList)

		expect(apiProfilesListMock).toHaveBeenCalledExactlyOnceWith()
	})

	it('lists details of a specified device profile', async () => {
		await expect(cmd.handler(defaultInputArgv)).resolves.not.toThrow()

		expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(defaultInputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ primaryKeyName: 'id' }),
			'argv-profile-id',
			expect.any(Function),
			expect.any(Function),
		)

		apiProfilesListMock.mockResolvedValueOnce(profileList)
		const getFunction = outputItemOrListMock.mock.calls[0][4]
		apiProfilesGetMock.mockResolvedValue(deviceProfile1)

		expect(await getFunction('chosen-device-profile-id')).toStrictEqual(deviceProfile1)

		expect(apiProfilesGetMock).toHaveBeenCalledExactlyOnceWith('chosen-device-profile-id')

		buildTableOutputMock.mockReturnValueOnce('build table output')
		const config = outputItemOrListMock.mock.calls[0][1] as
			CustomCommonOutputProducer<DeviceProfile & WithOrganization>
		expect(config.buildTableOutput(deviceProfile1)).toBe('build table output')
		expect(buildTableOutputMock).toHaveBeenCalledExactlyOnceWith(tableGeneratorMock, deviceProfile1)
	})

	it('includes extra details with verbose flag', async () => {
		await expect(cmd.handler({ ...defaultInputArgv, verbose: true })).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({
				listTableFieldDefinitions: expect.arrayContaining([
					{ label: 'Profile Id', value: expect.any(Function) },
					{ label: 'Manufacturer Name', value: expect.any(Function) },
				]),
			}),
			'argv-profile-id',
			expect.any(Function),
			expect.any(Function),
		)

		const config = outputItemOrListMock.mock.calls[0][1] as
			TableCommonListOutputProducer<DeviceProfile & WithOrganization>

		const profileIdValue = (config.listTableFieldDefinitions[3] as
			ValueTableFieldDefinition<DeviceProfile & WithOrganization>).value
		expect(profileIdValue({} as DeviceProfile)).toBe('')
		expect(profileIdValue({ metadata: { vid: 'vid-value' } } as unknown as DeviceProfile))
			.toBe('vid-value')

		const manufacturerNameValue = (config.listTableFieldDefinitions[4] as
			ValueTableFieldDefinition<DeviceProfile & WithOrganization>).value
		expect(manufacturerNameValue({} as DeviceProfile)).toBe('')
		expect(manufacturerNameValue({ metadata: { mnmn: 'mnmn-value' } } as unknown as DeviceProfile))
			.toBe('mnmn-value')

	})
})
