import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { CommandArgs } from '../../../../commands/edge/channels/metainfo.js'

import { ChannelsEndpoint, DriverChannelDetails, EdgeDriver } from '@smartthings/core-sdk'

import type { APICommand, APICommandFlags } from '../../../../lib/command/api-command.js'
import type { CustomCommonOutputProducer } from '../../../../lib/command/format.js'
import type { outputItemOrList, outputItemOrListBuilder } from '../../../../lib/command/listing-io.js'
import { type buildTableOutput, listTableFieldDefinitions } from '../../../../lib/command/util/edge-drivers.js'
import type { chooseChannel } from '../../../../lib/command/util/edge/channels-choose.js'
import { apiCommandMocks } from '../../../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../../../test-lib/builder-mock.js'
import { tableGeneratorMock } from '../../../test-lib/table-mock.js'


const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks('../../../..')

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

const chooseChannelMock = jest.fn<typeof chooseChannel>().mockResolvedValue('chosen-channel-id')
jest.unstable_mockModule('../../../../lib/command/util/edge/channels-choose.js', () => ({
	chooseChannel: chooseChannelMock,
}))


const { default: cmd } = await import('../../../../commands/edge/channels/metainfo.js')


test('builder', async () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiCommandBuilderArgvMock,
		positionalMock,
		optionMock,
		exampleMock,
		argvMock,
	} = buildArgvMock<APICommandFlags, CommandArgs>()

	apiCommandBuilderMock.mockReturnValue(apiCommandBuilderArgvMock)
	outputItemOrListBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)
	expect(outputItemOrListBuilderMock).toHaveBeenCalledExactlyOnceWith(apiCommandBuilderArgvMock)
	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(optionMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const driver1 = { driverId: 'driver-id-1', name: 'Driver 1' } as EdgeDriver
	const driver2 = { driverId: 'driver-id-2', name: 'Driver 2' } as EdgeDriver
	const driver1ChannelDetails = { driverId: 'driver-id-1', channelId: 'channel-id-1' } as DriverChannelDetails
	const driver2ChannelDetails = { driverId: 'driver-id-2', channelId: 'channel-id-1' } as DriverChannelDetails

	const apiChannelsListAssignedDriversMock =
		jest.fn<typeof ChannelsEndpoint.prototype.listAssignedDrivers>()
			.mockResolvedValue([driver1ChannelDetails, driver2ChannelDetails])
	const apiChannelsGetDriverChannelMetaInfoMock =
		jest.fn<typeof ChannelsEndpoint.prototype.getDriverChannelMetaInfo>()
	const command = {
		client: {
			channels: {
				getDriverChannelMetaInfo: apiChannelsGetDriverChannelMetaInfoMock,
				listAssignedDrivers: apiChannelsListAssignedDriversMock,
			},
		},
		tableGenerator: tableGeneratorMock,
	} as unknown as APICommand
	apiCommandMock.mockResolvedValue(command)

	const baseInputArgv = { profile: 'default' } as ArgumentsCamelCase<CommandArgs>
	it('prompts for a channel and lists metadata', async () => {
		await expect(cmd.handler(baseInputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(baseInputArgv)
		expect(chooseChannelMock).toHaveBeenCalledExactlyOnceWith(
			command,
			undefined,
			expect.objectContaining({ useConfigDefault: true }),
		)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ listTableFieldDefinitions }),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		const listFunction = outputItemOrListMock.mock.calls[0][3]
		apiChannelsGetDriverChannelMetaInfoMock.mockResolvedValueOnce(driver1)
		apiChannelsGetDriverChannelMetaInfoMock.mockResolvedValueOnce(driver2)

		expect(await listFunction()).toStrictEqual([driver1, driver2])

		expect(apiChannelsListAssignedDriversMock).toHaveBeenCalledExactlyOnceWith('chosen-channel-id')
		expect(apiChannelsGetDriverChannelMetaInfoMock).toHaveBeenCalledTimes(2)
		expect(apiChannelsGetDriverChannelMetaInfoMock).toHaveBeenCalledWith('chosen-channel-id', 'driver-id-1')
		expect(apiChannelsGetDriverChannelMetaInfoMock).toHaveBeenCalledWith('chosen-channel-id', 'driver-id-2')
	})

	it('displays details for a specific driver', async () => {
		const inputArgv = { ...baseInputArgv, driverIdOrIndex: 'cmd-line-driver-id', channel: 'cmd-line-channel-id' }
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(chooseChannelMock).toHaveBeenCalledExactlyOnceWith(
			command,
			'cmd-line-channel-id',
			expect.objectContaining({ useConfigDefault: true }),
		)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ listTableFieldDefinitions }),
			'cmd-line-driver-id',
			expect.any(Function),
			expect.any(Function),
		)

		const getFunction = outputItemOrListMock.mock.calls[0][4]
		apiChannelsGetDriverChannelMetaInfoMock.mockResolvedValueOnce(driver1)

		expect(await getFunction('driver-id')).toBe(driver1)

		expect(apiChannelsGetDriverChannelMetaInfoMock)
			.toHaveBeenCalledExactlyOnceWith('chosen-channel-id', 'driver-id')

		buildTableOutputMock.mockReturnValueOnce('table output')

		const buildTableOutput =
			(outputItemOrListMock.mock.calls[0][1] as CustomCommonOutputProducer<EdgeDriver>).buildTableOutput

		expect(buildTableOutput(driver1)).toBe('table output')

		expect(buildTableOutputMock).toHaveBeenCalledExactlyOnceWith(tableGeneratorMock, driver1)
	})
})
