import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv } from 'yargs'

import { type Device, DeviceIntegrationType, type HubdevicesEndpoint } from '@smartthings/core-sdk'

import type { CommandArgs } from '../../../../commands/edge/drivers/switch.js'
import type { buildEpilog } from '../../../../lib/help.js'
import type { APICommand, APICommandFlags } from '../../../../lib/command/api-command.js'
import type { chooseDeviceFn } from '../../../../lib/command/util/devices-choose.js'
import type { chooseDriver } from '../../../../lib/command/util/drivers-choose.js'
import {
	type DriverChoice,
	edgeDeviceTypes,
	type listAllAvailableDrivers,
	type listMatchingDrivers,
} from '../../../../lib/command/util/edge-drivers.js'
import type { chooseHub } from '../../../../lib/command/util/hubs-choose.js'
import type { ChooseFunction } from '../../../../lib/command/util/util-util.js'
import { apiCommandMocks } from '../../../test-lib/api-command-mock.js'
import { buildArgvMock } from '../../../test-lib/builder-mock.js'


const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks('../../../..')

const chooseDeviceMock = jest.fn<ChooseFunction<Device>>().mockResolvedValue('chosen-device')
const chooseDeviceFnMock = jest.fn<typeof chooseDeviceFn>().mockReturnValue(chooseDeviceMock)
jest.unstable_mockModule('../../../../lib/command/util/devices-choose.js', () => ({
	chooseDeviceFn: chooseDeviceFnMock,
}))

const chooseDriverMock = jest.fn<typeof chooseDriver>().mockResolvedValue('chosen-driver')
jest.unstable_mockModule('../../../../lib/command/util/drivers-choose.js', () => ({
	chooseDriver: chooseDriverMock,
}))

const listAllAvailableDriversMock = jest.fn<typeof listAllAvailableDrivers>()
const listMatchingDriversMock = jest.fn<typeof listMatchingDrivers>()
jest.unstable_mockModule('../../../../lib/command/util/edge-drivers.js', () => ({
	edgeDeviceTypes,
	listAllAvailableDrivers: listAllAvailableDriversMock,
	listMatchingDrivers: listMatchingDriversMock,
}))

const chooseHubMock = jest.fn<typeof chooseHub>().mockResolvedValue('chosen-hub')
jest.unstable_mockModule('../../../../lib/command/util/hubs-choose.js', () => ({
	chooseHub: chooseHubMock,
}))

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /* do nothing */ })


const { default: cmd } = await import('../../../../commands/edge/drivers/switch.js')


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
	expect(optionMock).toHaveBeenCalledTimes(3)
	expect(exampleMock).toHaveBeenCalledTimes(1)
	expect(buildEpilogMock).toHaveBeenCalledTimes(1)
	expect(epilogMock).toHaveBeenCalledTimes(1)
})

describe('handler', () => {
	const apiHubDevicesSwitchDriverMock = jest.fn<typeof HubdevicesEndpoint.prototype.switchDriver>()
	const command = {
		client: {
			hubdevices: {
				switchDriver: apiHubDevicesSwitchDriverMock,
			},
		},
	} as unknown as APICommand
	apiCommandMock.mockResolvedValue(command)

	const driver1 = { driverId: 'driver-id-1' } as DriverChoice
	const driver2 = { driverId: 'driver-id-2' } as DriverChoice
	const matchingDrivers = [driver2]
	const allDrivers = [driver1, driver2]
	listMatchingDriversMock.mockResolvedValue(matchingDrivers)
	listAllAvailableDriversMock.mockResolvedValue(allDrivers)

	const inputArgv = {
		profile: 'default',
	} as ArgumentsCamelCase<CommandArgs>

	it('prompts for all information by default', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(chooseHubMock).toHaveBeenCalledExactlyOnceWith(
			command,
			undefined,
			{ promptMessage: 'Which hub is the device connected to?', useConfigDefault: true },
		)
		expect(chooseDeviceFnMock).toHaveBeenCalledExactlyOnceWith({ type: edgeDeviceTypes })
		expect(chooseDeviceMock).toHaveBeenCalledExactlyOnceWith(
			command,
			undefined,
			{ listFilter: expect.any(Function) },
		)
		expect(listMatchingDriversMock).toHaveBeenCalledExactlyOnceWith(command.client, 'chosen-device', 'chosen-hub')
		expect(chooseDriverMock).toHaveBeenCalledExactlyOnceWith(
			command,
			undefined,
			{ promptMessage: 'Choose a driver to use.', listItems: expect.any(Function) },
		)
		expect(apiHubDevicesSwitchDriverMock).toHaveBeenCalledExactlyOnceWith(
			'chosen-driver',
			'chosen-hub',
			'chosen-device',
			undefined,
		)
		expect(consoleLogSpy).toHaveBeenCalledWith('Updated driver for device chosen-device to chosen-driver.')

		expect(listAllAvailableDriversMock).not.toHaveBeenCalled()

		const driversListItems = chooseDriverMock.mock.calls[0][2]?.listItems

		// listMatchingDriversMock should not get called a second time
		expect(listMatchingDriversMock).toHaveBeenCalledTimes(1)
		expect(await driversListItems?.(command)).toBe(matchingDrivers)
		expect(listMatchingDriversMock).toHaveBeenCalledTimes(1)
	})

	it('does not include non-edge devices', async () => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		const deviceListFilter = chooseDeviceMock.mock.calls[0][2]?.listFilter

		expect(deviceListFilter?.({} as Device, 0, [])).toBe(false)
		expect(deviceListFilter?.({ type: DeviceIntegrationType.BLE } as Device, 0, [])).toBe(false)
	})

	it.each([
		DeviceIntegrationType.LAN,
		DeviceIntegrationType.MATTER,
		DeviceIntegrationType.ZIGBEE,
		DeviceIntegrationType.ZWAVE,
	])('only includes edge devices on chosen hub', async type => {
		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		const deviceListFilter = chooseDeviceMock.mock.calls[0][2]?.listFilter
		const matchingDevice = { type, [type.toLowerCase()]: { hubId: 'chosen-hub' } } as unknown as Device

		expect(deviceListFilter?.({ type } as Device, 0, [])).toBe(false)
		expect(deviceListFilter?.(matchingDevice, 0, [])).toBe(true)
	})

	it('includes even non-matching drivers when requested', async () => {
		await expect(cmd.handler({ ...inputArgv, includeNonMatching: true })).resolves.not.toThrow()

		expect(apiHubDevicesSwitchDriverMock).toHaveBeenCalledExactlyOnceWith(
			'chosen-driver',
			'chosen-hub',
			'chosen-device',
			true,
		)

		expect(listAllAvailableDriversMock).not.toHaveBeenCalled()

		const driversListItems = chooseDriverMock.mock.calls[0][2]?.listItems

		expect(await driversListItems?.(command)).toBe(allDrivers)
		expect(listAllAvailableDriversMock).toHaveBeenCalledExactlyOnceWith(
			command.client,
			'chosen-device',
			'chosen-hub',
		)
	})

	it('accepts input from command line', async () => {
		await expect(cmd.handler({
			...inputArgv,
			deviceId: 'cmd-line-device',
			hub: 'cmd-line-hub',
			driver: 'cmd-line-driver',
		})).resolves.not.toThrow()

		expect(chooseHubMock).toHaveBeenCalledExactlyOnceWith(
			command,
			'cmd-line-hub',
			{ promptMessage: 'Which hub is the device connected to?', useConfigDefault: true },
		)
		expect(chooseDeviceMock).toHaveBeenCalledExactlyOnceWith(
			command,
			'cmd-line-device',
			{ listFilter: expect.any(Function) },
		)
		expect(chooseDriverMock).toHaveBeenCalledExactlyOnceWith(
			command,
			'cmd-line-driver',
			{ promptMessage: 'Choose a driver to use.', listItems: expect.any(Function) },
		)
	})
})
