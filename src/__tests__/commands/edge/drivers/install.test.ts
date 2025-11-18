import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type { EnrolledChannel, HubdevicesEndpoint } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../../commands/edge/drivers/install.js'
import type { buildEpilog } from '../../../../lib/help.js'
import type { APICommand, APICommandFlags } from '../../../../lib/command/api-command.js'
import type { selectFromList } from '../../../../lib/command/select.js'
import type { chooseDriverFromChannelFn } from '../../../../lib/command/util/drivers-choose.js'
import type { DriverChannelDetailsWithName } from '../../../../lib/command/util/edge-drivers.js'
import type { chooseHub } from '../../../../lib/command/util/hubs-choose.js'
import type { ChooseFunction } from '../../../../lib/command/util/util-util.js'
import { apiCommandMocks } from '../../../test-lib/api-command-mock.js'
import { buildArgvMock } from '../../../test-lib/builder-mock.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks('../../../..')

const selectFromListMock = jest.fn<typeof selectFromList>()
jest.unstable_mockModule('../../../../lib/command/select.js', () => ({
	selectFromList: selectFromListMock,
}))

const chooseDriverFromChannelMock = jest.fn<ChooseFunction<DriverChannelDetailsWithName>>()
	.mockResolvedValue('driver-id-chosen-from-channel')
const chooseDriverFromChannelFnMock = jest.fn<typeof chooseDriverFromChannelFn>()
	.mockReturnValue(chooseDriverFromChannelMock)
jest.unstable_mockModule('../../../../lib/command/util/drivers-choose.js', () => ({
	chooseDriverFromChannelFn: chooseDriverFromChannelFnMock,
}))

const chooseHubMock = jest.fn<typeof chooseHub>().mockResolvedValue('chosen-hub-id')
jest.unstable_mockModule('../../../../lib/command/util/hubs-choose.js', () => ({
	chooseHub: chooseHubMock,
}))

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /* do nothing */ })


const { default: cmd } = await import('../../../../commands/edge/drivers/install.js')


test('builder', () => {
	const {
		yargsMock,
		positionalMock,
		optionMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<APICommandFlags, CommandArgs>()

	apiCommandBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>
	expect(builder(yargsMock)).toBe(argvMock)

	expect(apiCommandBuilderMock).toHaveBeenCalledExactlyOnceWith(yargsMock)

	expect(positionalMock).toHaveBeenCalledTimes(1)
	expect(optionMock).toHaveBeenCalledTimes(2)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const enrolledChannels = [{ channelId: 'channel-1-id' }] as EnrolledChannel[]
	const apiHubDevicesEnrolledChannelsMock = jest.fn<typeof HubdevicesEndpoint.prototype.enrolledChannels>()
		.mockResolvedValue(enrolledChannels)
	const apiHubDevicesInstallDriverMock = jest.fn<typeof HubdevicesEndpoint.prototype.installDriver>()
	const command = {
		client: {
			hubdevices: {
				enrolledChannels: apiHubDevicesEnrolledChannelsMock,
				installDriver: apiHubDevicesInstallDriverMock,
			},
		},
	} as unknown as APICommand
	apiCommandMock.mockResolvedValue(command)

	const baseInputArgv = {
		profile: 'default',
	} as ArgumentsCamelCase<CommandArgs>

	it('installs from command line options', async () => {
		const inputArgv = {
			profile: 'default',
			hub: 'cmd-line-hub-id',
			channel: 'cmd-line-channel-id',
			driver: 'cmd-line-driver-id',
		} as ArgumentsCamelCase<CommandArgs>

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(chooseHubMock).toHaveBeenCalledExactlyOnceWith(
			command,
			'cmd-line-hub-id',
			expect.objectContaining({ useConfigDefault: true }),
		)
		expect(chooseDriverFromChannelFnMock).toHaveBeenCalledExactlyOnceWith('cmd-line-channel-id')
		expect(chooseDriverFromChannelMock).toHaveBeenCalledExactlyOnceWith(
			command,
			'cmd-line-driver-id',
			{ promptMessage: 'Select a driver to install.' },
		)
		expect(apiHubDevicesInstallDriverMock).toHaveBeenCalledExactlyOnceWith(
			'driver-id-chosen-from-channel', 'chosen-hub-id', 'cmd-line-channel-id',
		)
		expect(consoleLogSpy)
			.toHaveBeenCalledWith('driver driver-id-chosen-from-channel installed to hub chosen-hub-id')

		expect(selectFromListMock).not.toHaveBeenCalled()
		expect(apiHubDevicesEnrolledChannelsMock).not.toHaveBeenCalled()
	})

	it('installs from prompts', async () => {
		selectFromListMock.mockResolvedValueOnce('chosen-channel-id')
		await expect(cmd.handler(baseInputArgv)).resolves.not.toThrow()

		expect(chooseHubMock).toHaveBeenCalledExactlyOnceWith(
			command,
			undefined,
			expect.objectContaining({ useConfigDefault: true }),
		)
		expect(selectFromListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ itemName: 'hub-enrolled channel' }),
			expect.objectContaining({ listItems: expect.any(Function) }),
		)
		expect(chooseDriverFromChannelFnMock).toHaveBeenCalledExactlyOnceWith('chosen-channel-id')
		expect(chooseDriverFromChannelMock).toHaveBeenCalledExactlyOnceWith(
			command,
			undefined,
			{ promptMessage: 'Select a driver to install.' },
		)
		expect(apiHubDevicesInstallDriverMock).toHaveBeenCalledExactlyOnceWith(
			'driver-id-chosen-from-channel', 'chosen-hub-id', 'chosen-channel-id',
		)
		expect(consoleLogSpy)
			.toHaveBeenCalledWith('driver driver-id-chosen-from-channel installed to hub chosen-hub-id')

		const listItems = selectFromListMock.mock.calls[0][2].listItems

		expect(await listItems()).toBe(enrolledChannels)

		expect(apiHubDevicesEnrolledChannelsMock).toHaveBeenCalledExactlyOnceWith('chosen-hub-id')
	})
})
