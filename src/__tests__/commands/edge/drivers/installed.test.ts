import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { HubdevicesEndpoint, InstalledDriver } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../../commands/edge/drivers/installed.js'
import type { buildEpilog } from '../../../../lib/help.js'
import type { APICommand, APICommandFlags } from '../../../../lib/command/api-command.js'
import type { TableCommonOutputProducer } from '../../../../lib/command/format.js'
import type { outputItemOrList, outputItemOrListBuilder } from '../../../../lib/command/listing-io.js'
import { chooseHub } from '../../../../lib/command/util/hubs-choose.js'
import type { withChannelNames, WithNamedChannel } from '../../../../lib/command/util/edge/channels.js'
import { apiCommandMocks } from '../../../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../../../test-lib/builder-mock.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks('../../../..')

const outputItemOrListMock = jest.fn<typeof outputItemOrList<InstalledDriver & WithNamedChannel>>()
const outputItemOrListBuilderMock = jest.fn<typeof outputItemOrListBuilder>()
jest.unstable_mockModule('../../../../lib/command/listing-io.js', () => ({
	outputItemOrList: outputItemOrListMock,
	outputItemOrListBuilder: outputItemOrListBuilderMock,
}))

const chooseHubMock = jest.fn<typeof chooseHub>().mockResolvedValue('chosen-hub-id')
jest.unstable_mockModule('../../../../lib/command/util/hubs-choose.js', () => ({
	chooseHub: chooseHubMock,
}))

const withChannelNamesMock = jest.fn<typeof withChannelNames<InstalledDriver>>()
jest.unstable_mockModule('../../../../lib/command/util/edge/channels.js', () => ({
	withChannelNames: withChannelNamesMock,
}))


const { default: cmd } = await import('../../../../commands/edge/drivers/installed.js')


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
	expect(optionMock).toHaveBeenCalledTimes(3)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})


describe('handler', () => {
	const driver1 = { driverId: 'driver-id-1' } as InstalledDriver
	const driver2 = { driverId: 'driver-id-2' } as InstalledDriver
	const drivers = [driver1, driver2]

	const apiHubDevicesGetInstalledMock = jest.fn<typeof HubdevicesEndpoint.prototype.getInstalled>()
		.mockResolvedValue(driver1)
	const apiHubDevicesListInstalledMock = jest.fn<typeof HubdevicesEndpoint.prototype.listInstalled>()
		.mockResolvedValue(drivers)
	const command = {
		client: {
			hubdevices: {
				getInstalled: apiHubDevicesGetInstalledMock,
				listInstalled: apiHubDevicesListInstalledMock,
			},
		},
	} as unknown as APICommand<ArgumentsCamelCase<CommandArgs>>
	apiCommandMock.mockResolvedValue(command)

	const driver1WithChannel = { ...driver1, channelName: 'Channel Name' } as InstalledDriver & WithNamedChannel
	const driver2WithChannel = { ...driver2, channelName: 'Channel Name' } as InstalledDriver & WithNamedChannel
	const driversWithChannels = [driver1WithChannel, driver2WithChannel]
	withChannelNamesMock.mockResolvedValue(driversWithChannels)

	const inputArgv = {
		profile: 'default',
		verbose: false,
	} as ArgumentsCamelCase<CommandArgs>

	it('lists installed drivers by default', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(chooseHubMock).toHaveBeenCalledExactlyOnceWith(
			command,
			undefined,
			expect.objectContaining({ useConfigDefault: true }),
		)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({
				primaryKeyName: 'driverId',
				tableFieldDefinitions: expect.arrayContaining(['name', 'driverId']),
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)
		const config = outputItemOrListMock.mock.calls[0][1] as TableCommonOutputProducer<InstalledDriver>
		expect(config.tableFieldDefinitions).not.toContain('channelName')

		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toBe(drivers)

		expect(apiHubDevicesListInstalledMock).toHaveBeenCalledExactlyOnceWith('chosen-hub-id', undefined)

		expect(withChannelNamesMock).not.toHaveBeenCalled()
		expect(apiHubDevicesGetInstalledMock).not.toHaveBeenCalled()
	})

	it('includes channel id in verbose mode', async () => {
		await expect(cmd.handler({ ...inputArgv, verbose: true })).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({
				primaryKeyName: 'driverId',
				tableFieldDefinitions: expect.arrayContaining(['channelName']),
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		const listFunction = outputItemOrListMock.mock.calls[0][3]

		expect(await listFunction()).toBe(driversWithChannels)

		expect(apiHubDevicesListInstalledMock).toHaveBeenCalledExactlyOnceWith('chosen-hub-id', undefined)
		expect(withChannelNamesMock).toHaveBeenCalledExactlyOnceWith(command.client, drivers)

		expect(apiHubDevicesGetInstalledMock).not.toHaveBeenCalled()
	})

	it('displays details of a specified driver', async () => {
		await expect(cmd.handler({ ...inputArgv, idOrIndex: 'cmd-line-id' })).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({
				tableFieldDefinitions: expect.not.arrayContaining(['channelName']),
			}),
			'cmd-line-id',
			expect.any(Function),
			expect.any(Function),
		)

		const getFunction = outputItemOrListMock.mock.calls[0][4]

		expect(await getFunction('driver-id')).toBe(driver1)

		expect(apiHubDevicesGetInstalledMock).toHaveBeenCalledExactlyOnceWith('chosen-hub-id', 'driver-id')

		expect(withChannelNamesMock).not.toHaveBeenCalled()
		expect(apiHubDevicesListInstalledMock).not.toHaveBeenCalled()
	})

	it('includes channel name in details in verbose mode', async () => {
		await expect(cmd.handler({ ...inputArgv, idOrIndex: 'cmd-line-id', verbose: true })).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({
				tableFieldDefinitions: expect.arrayContaining(['channelName']),
			}),
			'cmd-line-id',
			expect.any(Function),
			expect.any(Function),
		)

		const getFunction = outputItemOrListMock.mock.calls[0][4]
		withChannelNamesMock.mockResolvedValueOnce(driver1WithChannel as unknown as (InstalledDriver & WithNamedChannel)[])

		expect(await getFunction('driver-id')).toBe(driver1WithChannel)

		expect(apiHubDevicesGetInstalledMock).toHaveBeenCalledExactlyOnceWith('chosen-hub-id', 'driver-id')
		expect(withChannelNamesMock).toHaveBeenCalledExactlyOnceWith(command.client, driver1)

		expect(apiHubDevicesListInstalledMock).not.toHaveBeenCalled()
	})
})
