import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type {
	DriversEndpoint,
	EdgeDriver,
	SmartThingsClient,
} from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../commands/edge/drivers.js'
import type { WithOrganization } from '../../../lib/api-helpers.js'
import type {
	APIOrganizationCommand,
	APIOrganizationCommandFlags,
	apiOrganizationCommand,
	apiOrganizationCommandBuilder,
} from '../../../lib/command/api-organization-command.js'
import type {
	AllOrganizationFlags,
	allOrganizationsBuilder,
} from '../../../lib/command/common-flags.js'
import type { CustomCommonOutputProducer } from '../../../lib/command/format.js'
import type { outputItemOrList, outputItemOrListBuilder } from '../../../lib/command/listing-io.js'
import type { shortARNorURL, verboseApps } from '../../../lib/command/util/apps-util.js'
import {
	type buildTableOutput,
	type listDrivers,
	listTableFieldDefinitions,
} from '../../../lib/command/util/edge/drivers-util.js'
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

const allOrganizationsBuilderMock = jest.fn<typeof allOrganizationsBuilder>()
jest.unstable_mockModule('../../../lib/command/common-flags.js', () => ({
	allOrganizationsBuilder: allOrganizationsBuilderMock,
}))

const outputItemOrListMock =
	jest.fn<typeof outputItemOrList<EdgeDriver, EdgeDriver & WithOrganization>>()
const outputItemOrListBuilderMock = jest.fn<typeof outputItemOrListBuilder>()
jest.unstable_mockModule('../../../lib/command/listing-io.js', () => ({
	outputItemOrList: outputItemOrListMock,
	outputItemOrListBuilder: outputItemOrListBuilderMock,
}))

const shortARNorURLMock = jest.fn<typeof shortARNorURL>()
const verboseAppsMock = jest.fn<typeof verboseApps>()
jest.unstable_mockModule('../../../lib/command/util/apps-util.js', () => ({
	shortARNorURL: shortARNorURLMock,
	verboseApps: verboseAppsMock,
	tableFieldDefinitions: [],
}))

const buildTableOutputMock = jest.fn<typeof buildTableOutput>()
const listDriversMock = jest.fn<typeof listDrivers>()
jest.unstable_mockModule('../../../lib/command/util/edge/drivers-util.js', () => ({
	buildTableOutput: buildTableOutputMock,
	listDrivers: listDriversMock,
	listTableFieldDefinitions,
}))


const { default: cmd } = await import('../../../commands/edge/drivers.js')


test('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const apiOrganizationCommandBuilderArgvMock = buildArgvMockStub<APIOrganizationCommandFlags>()
	const {
		yargsMock: allOrganizationsBuilderArgvMock,
		positionalMock,
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

	expect(positionalMock).toHaveBeenCalledTimes(2)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(apiDocsURLMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const driver1 = { driverId: 'driver-id-1' } as EdgeDriver & WithOrganization
	const driver2 = { driverId: 'driver-id-2' } as EdgeDriver & WithOrganization
	const driverList = [driver1, driver2]

	const apiDriversGetMock = jest.fn<typeof DriversEndpoint.prototype.get>()
	const apiDriversGetRevisionMock = jest.fn<typeof DriversEndpoint.prototype.getRevision>()
		.mockResolvedValue(driver2)

	const clientMock = {
		drivers: {
			get: apiDriversGetMock,
			getRevision: apiDriversGetRevisionMock,
		},
	} as unknown as SmartThingsClient
	const command = {
		client: clientMock,
		tableGenerator: tableGeneratorMock,
	} as APIOrganizationCommand<ArgumentsCamelCase<CommandArgs>>
	apiOrganizationCommandMock.mockResolvedValue(command)

	const defaultInputArgv = {
		profile: 'default',
		idOrIndex: 'argv-driver-id',
	} as ArgumentsCamelCase<CommandArgs>

	it('lists user drivers without args', async () => {
		await expect(cmd.handler(defaultInputArgv)).resolves.not.toThrow()

		expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(defaultInputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ primaryKeyName: 'driverId' }),
			'argv-driver-id',
			expect.any(Function),
			expect.any(Function),
		)

		listDriversMock.mockResolvedValueOnce(driverList)
		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toStrictEqual([driver1, driver2])

		expect(listDriversMock).toHaveBeenCalledExactlyOnceWith(command.client)
	})

	it('lists drivers for all organizations', async () => {
		await expect(cmd.handler({ ...defaultInputArgv, allOrganizations: true }))
			.resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({
				listTableFieldDefinitions: expect.arrayContaining(['organization']),
			}),
			'argv-driver-id',
			expect.any(Function),
			expect.any(Function),
		)

		expect(listDriversMock).not.toHaveBeenCalled()

		listDriversMock.mockResolvedValueOnce(driverList)
		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toBe(driverList)

		expect(listDriversMock).toHaveBeenCalledExactlyOnceWith(command.client, true)
	})

	it('lists details of a specified device driver', async () => {
		await expect(cmd.handler(defaultInputArgv)).resolves.not.toThrow()

		expect(apiOrganizationCommandMock).toHaveBeenCalledExactlyOnceWith(defaultInputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ primaryKeyName: 'driverId' }),
			'argv-driver-id',
			expect.any(Function),
			expect.any(Function),
		)

		const getFunction = outputItemOrListMock.mock.calls[0][4]
		apiDriversGetMock.mockResolvedValue(driver1)

		expect(await getFunction('chosen-driver-id')).toStrictEqual(driver1)

		expect(apiDriversGetMock).toHaveBeenCalledExactlyOnceWith('chosen-driver-id')
		expect(apiDriversGetRevisionMock).not.toHaveBeenCalled()

		buildTableOutputMock.mockReturnValueOnce('build table output')
		const config = outputItemOrListMock.mock.calls[0][1] as
			CustomCommonOutputProducer<EdgeDriver & WithOrganization>
		expect(config.buildTableOutput(driver1)).toBe('build table output')
		expect(buildTableOutputMock).toHaveBeenCalledExactlyOnceWith(tableGeneratorMock, driver1)
	})

	it('queries specific driver with driver-version flag', async () => {
		await expect(cmd.handler({ ...defaultInputArgv, driverVersion: 'driver-version' }))
			.resolves.not.toThrow()

		const getFunction = outputItemOrListMock.mock.calls[0][4]
		apiDriversGetRevisionMock.mockResolvedValue(driver2)

		expect(await getFunction('chosen-driver-id')).toStrictEqual(driver2)

		expect(apiDriversGetRevisionMock)
			.toHaveBeenCalledExactlyOnceWith('chosen-driver-id', 'driver-version')
		expect(apiDriversGetMock).not.toHaveBeenCalled()
	})
})
