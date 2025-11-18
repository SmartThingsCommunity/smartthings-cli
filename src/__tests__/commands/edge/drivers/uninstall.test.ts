import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import type{ Device, HubdevicesEndpoint, InstalledDriver } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../../commands/edge/drivers/uninstall.js'
import type { buildEpilog } from '../../../../lib/help.js'
import type { APICommand, APICommandFlags } from '../../../../lib/command/api-command.js'
import type { chooseDriverFromChannelFn } from '../../../../lib/command/util/drivers-choose.js'
import type { DriverChannelDetailsWithName } from '../../../../lib/command/util/edge-drivers.js'
import type { chooseDriver } from '../../../../lib/command/util/drivers-choose.js'
import type { chooseHubFn } from '../../../../lib/command/util/hubs-choose.js'
import type { ChooseFunction } from '../../../../lib/command/util/util-util.js'
import { apiCommandMocks } from '../../../test-lib/api-command-mock.js'
import { buildArgvMock } from '../../../test-lib/builder-mock.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks('../../../..')

const chooseDriverFromChannelMock = jest.fn<ChooseFunction<DriverChannelDetailsWithName>>()
	.mockResolvedValue('driver-id-chosen-from-channel')
const chooseDriverFromChannelFnMock = jest.fn<typeof chooseDriverFromChannelFn>()
	.mockReturnValue(chooseDriverFromChannelMock)
jest.unstable_mockModule('../../../../lib/command/util/drivers-choose.js', () => ({
	chooseDriverFromChannelFn: chooseDriverFromChannelFnMock,
}))

const chooseDriverMock = jest.fn<typeof chooseDriver>().mockResolvedValue('chosen-driver-id')
jest.unstable_mockModule('../../../../lib/command/util/drivers-choose.js', () => ({
	chooseDriver: chooseDriverMock,
}))

const chooseHubMock = jest.fn<ChooseFunction<Device>>().mockResolvedValue('chosen-hub-id')
const chooseHubFnMock = jest.fn<typeof chooseHubFn>().mockReturnValue(chooseHubMock)
jest.unstable_mockModule('../../../../lib/command/util/hubs-choose.js', () => ({
	chooseHubFn: chooseHubFnMock,
}))

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /* do nothing */ })


const { default: cmd } = await import('../../../../commands/edge/drivers/uninstall.js')


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
	expect(optionMock).toHaveBeenCalledTimes(1)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

test('handler', async () => {
	const apiHubDevicesListInstalledMock = jest.fn<typeof HubdevicesEndpoint.prototype.listInstalled>()
	const apiHubDevicesUninstallDriverMock = jest.fn<typeof HubdevicesEndpoint.prototype.uninstallDriver>()
	const command = {
		client: {
			hubdevices: {
				listInstalled: apiHubDevicesListInstalledMock,
				uninstallDriver: apiHubDevicesUninstallDriverMock,
			},
		},
	} as unknown as APICommand
	apiCommandMock.mockResolvedValue(command)

	const inputArgv = {
		profile: 'default',
		driverId: 'cmd-line-driver-id',
		hub: 'cmd-line-hub-id',
	} as ArgumentsCamelCase<CommandArgs>

	await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

	expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
	expect(chooseHubFnMock).toHaveBeenCalledExactlyOnceWith({ withInstalledDriverId: 'cmd-line-driver-id' })
	expect(chooseHubMock).toHaveBeenCalledExactlyOnceWith(
		command,
		'cmd-line-hub-id',
		{ promptMessage: 'Select a hub to uninstall from.' },
	)
	expect(chooseDriverMock).toHaveBeenCalledExactlyOnceWith(
		command,
		'cmd-line-driver-id',
		{ promptMessage: 'Select a driver to uninstall.', listItems: expect.any(Function) },
	)
	expect(apiHubDevicesUninstallDriverMock).toHaveBeenCalledExactlyOnceWith('chosen-driver-id', 'chosen-hub-id')
	expect(consoleLogSpy).toHaveBeenCalledWith('Driver chosen-driver-id uninstalled from hub chosen-hub-id.')

	const listInstalledDrivers = chooseDriverMock.mock.calls[0][2]?.listItems

	const installedDrivers = [{ driverId: 'driver-id' } as InstalledDriver]
	apiHubDevicesListInstalledMock.mockResolvedValueOnce(installedDrivers)

	expect(await listInstalledDrivers?.(command)).toBe(installedDrivers)
})
