import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { DriversEndpoint, EdgeDriver } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../../commands/edge/drivers/default.js'
import type { fatalError } from '../../../../lib/util.js'
import type { APICommand, APICommandFlags } from '../../../../lib/command/api-command.js'
import type { CustomCommonOutputProducer } from '../../../../lib/command/format.js'
import type { outputItemOrList, outputItemOrListBuilder } from '../../../../lib/command/listing-io.js'
import { buildTableOutput, listTableFieldDefinitions } from '../../../../lib/command/util/edge-drivers.js'
import { apiCommandMocks } from '../../../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../../../test-lib/builder-mock.js'
import { tableGeneratorMock } from '../../../test-lib/table-mock.js'


const fatalErrorMock = jest.fn<typeof fatalError>().mockReturnValue('never return' as never)
jest.unstable_mockModule('../../../../lib/util.js', () => ({
	fatalError: fatalErrorMock,
}))

const { apiCommandMock, apiCommandBuilderMock, apiDocsURLMock } = apiCommandMocks('../../../..')

const outputItemOrListMock = jest.fn<typeof outputItemOrList<EdgeDriver>>()
const outputItemOrListBuilderMock = jest.fn<typeof outputItemOrListBuilder>()
jest.unstable_mockModule('../../../../lib/command/listing-io.js', () => ({
	outputItemOrList: outputItemOrListMock,
	outputItemOrListBuilder: outputItemOrListBuilderMock,
}))

const buildTableOutputMock = jest.fn<typeof buildTableOutput>()
jest.unstable_mockModule('../../../../lib/command/util/edge-drivers.js', () => ({
	buildTableOutput: buildTableOutputMock,
	listTableFieldDefinitions,
}))


const { default: cmd } = await import('../../../../commands/edge/drivers/default.js')


test('builder', async () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiCommandBuilderArgvMock,
		positionalMock,
		optionMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APICommandFlags, CommandArgs>()

	apiCommandBuilderMock.mockReturnValue(apiCommandBuilderArgvMock)
	outputItemOrListBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(outputItemOrListBuilderMock).toHaveBeenCalledExactlyOnceWith(apiCommandBuilderArgvMock)
	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(optionMock).toHaveBeenCalledTimes(0)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(apiDocsURLMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handlers', () => {
	const apiDriversListDefaultMock = jest.fn<typeof DriversEndpoint.prototype.listDefault>()
	const command = {
		client: {
			drivers: {
				listDefault: apiDriversListDefaultMock,
			},
		},
		tableGenerator: tableGeneratorMock,
	} as unknown as APICommand<ArgumentsCamelCase<CommandArgs>>
	apiCommandMock.mockResolvedValue(command)

	const driver1 = { driverId: 'driver-id-1' } as EdgeDriver
	const driver2 = { driverId: 'driver-id-2' } as EdgeDriver
	const drivers = [driver1, driver2]
	apiDriversListDefaultMock.mockResolvedValue(drivers)

	const inputArgv = {
		profile: 'default',
	} as ArgumentsCamelCase<CommandArgs>

	it('lists default drivers by default', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({
				primaryKeyName: 'driverId',
				listTableFieldDefinitions,
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toBe(drivers)

		expect(apiDriversListDefaultMock).toHaveBeenCalledExactlyOnceWith()
	})

	it('displays details for a specific driver', async () => {
		await expect(cmd.handler({ ...inputArgv, idOrIndex: 'cmd-line-id' })).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({
				primaryKeyName: 'driverId',
				buildTableOutput: expect.any(Function),
			}),
			'cmd-line-id',
			expect.any(Function),
			expect.any(Function),
		)

		const getFunction = outputItemOrListMock.mock.calls[0][4]

		expect(await getFunction('driver-id-2')).toBe(driver2)

		expect(apiDriversListDefaultMock).toHaveBeenCalledExactlyOnceWith()
		expect(fatalErrorMock).not.toHaveBeenCalled()

		const config = outputItemOrListMock.mock.calls[0][1] as CustomCommonOutputProducer<EdgeDriver>
		const buildTableOutput = config.buildTableOutput

		buildTableOutputMock.mockReturnValueOnce('table output')

		expect(buildTableOutput(driver1)).toBe('table output')

		expect(buildTableOutputMock).toHaveBeenCalledExactlyOnceWith(tableGeneratorMock, driver1)
	})

	it('displays error for bad driver id', async () => {
		await expect(cmd.handler({ ...inputArgv, idOrIndex: 'cmd-line-id' })).resolves.not.toThrow()

		const getFunction = outputItemOrListMock.mock.calls[0][4]

		expect(await getFunction('bad-driver-id')).toBe('never return')

		expect(apiDriversListDefaultMock).toHaveBeenCalledExactlyOnceWith()
		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith('Could not find driver with id bad-driver-id.')
	})
})
