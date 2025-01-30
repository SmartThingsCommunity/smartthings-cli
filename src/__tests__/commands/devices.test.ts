import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv, Options } from 'yargs'

import {
	type Device,
	type DeviceHealth,
	DeviceHealthState,
	DeviceIntegrationType,
	DevicesEndpoint,
	type SmartThingsClient,
} from '@smartthings/core-sdk'

import type { CommandArgs, OutputDevice } from '../../commands/devices.js'
import type { withLocationAndRoom, withLocationsAndRooms } from '../../lib/api-helpers.js'
import type { APICommand, APICommandFlags } from '../../lib/command/api-command.js'
import type { outputItemOrList, outputItemOrListBuilder } from '../../lib/command/listing-io.js'
import type { CustomCommonOutputProducer } from '../../lib/command/format.js'
import type { BuildOutputFormatterFlags } from '../../lib/command/output-builder.js'
import type { SmartThingsCommandFlags } from '../../lib/command/smartthings-command.js'
import { buildTableOutput } from '../../lib/command/util/devices-table.js'
import { apiCommandMocks } from '../test-lib/api-command-mock.js'
import { buildArgvMock, buildArgvMockStub } from '../test-lib/builder-mock.js'
import { tableGeneratorMock } from '../test-lib/table-mock.js'


const withLocationAndRoomMock = jest.fn<typeof withLocationAndRoom>()
const withLocationsAndRoomsMock = jest.fn<typeof withLocationsAndRooms>()
jest.unstable_mockModule('../../lib/api-helpers.js', () => ({
	withLocationAndRoom: withLocationAndRoomMock,
	withLocationsAndRooms: withLocationsAndRoomsMock,
}))

const { apiCommandMock, apiCommandBuilderMock, apiDocsURLMock } = apiCommandMocks('../..')

const outputItemOrListMock = jest.fn<typeof outputItemOrList<OutputDevice>>()
const outputItemOrListBuilderMock = jest.fn<typeof outputItemOrListBuilder>()
jest.unstable_mockModule('../../lib/command/listing-io.js', () => ({
	outputItemOrList: outputItemOrListMock,
	outputItemOrListBuilder: outputItemOrListBuilderMock,
}))

const buildTableOutputMock = jest.fn<typeof buildTableOutput>()
jest.unstable_mockModule('../../lib/command/util/devices-table.js', () => ({
	buildTableOutput: buildTableOutputMock,
}))


const { default: cmd } = await import('../../commands/devices.js')


describe('builder', () => {
	const yargsMock = buildArgvMockStub<object>()
	const {
		yargsMock: apiCommandBuilderArgvMock,
		positionalMock,
		optionMock,
		exampleMock,
		epilogMock,
		argvMock,
	} = buildArgvMock<SmartThingsCommandFlags, BuildOutputFormatterFlags>()

	apiCommandBuilderMock.mockReturnValue(apiCommandBuilderArgvMock)
	outputItemOrListBuilderMock.mockReturnValue(argvMock)

	const builder = cmd.builder as (yargs: Argv<object>) => Argv<CommandArgs>

	it('calls correct parent and yargs functions', () => {
		expect(builder(yargsMock)).toBe(argvMock)

		expect(apiCommandBuilderMock).toHaveBeenCalledTimes(1)
		expect(apiCommandBuilderMock).toHaveBeenCalledWith(yargsMock)
		expect(outputItemOrListBuilderMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListBuilderMock).toHaveBeenCalledWith(apiCommandBuilderArgvMock)
		expect(positionalMock).toHaveBeenCalledTimes(1)
		expect(optionMock).toHaveBeenCalledTimes(9)
		expect(exampleMock).toHaveBeenCalledTimes(1)
		expect(apiDocsURLMock).toHaveBeenCalledTimes(1)
		expect(epilogMock).toHaveBeenCalledTimes(1)
	})

	// A simplified version of the type of the `Argv.option` that matches the way we call it.
	type OptionMock = jest.Mock<(key: string, options?: Options) => Argv<object & APICommandFlags>>

	it('accepts upper or lowercase types', () => {
		expect(builder(yargsMock)).toBe(argvMock)

		const typeCoerce = (optionMock as OptionMock).mock.calls[7][1]?.coerce
		expect(typeCoerce).toBeDefined()
		expect(typeCoerce?.(['ZIGBEE', 'zwave']))
			.toStrictEqual([DeviceIntegrationType.ZIGBEE, DeviceIntegrationType.ZWAVE])
		expect(typeCoerce?.(['zigbee', 'ZWAVE']))
			.toStrictEqual([DeviceIntegrationType.ZIGBEE, DeviceIntegrationType.ZWAVE])
	})
})


describe('handler', () => {
	const apiDevicesGetMock = jest.fn<typeof DevicesEndpoint.prototype.get>()
	const apiDevicesGetHealthMock = jest.fn<typeof DevicesEndpoint.prototype.getHealth>()
	const apiDevicesListMock = jest.fn<typeof DevicesEndpoint.prototype.list>()
	const clientMock = {
		devices: {
			get: apiDevicesGetMock,
			getHealth: apiDevicesGetHealthMock,
			list: apiDevicesListMock,
		},
	} as unknown as SmartThingsClient
	const command = {
		client: clientMock,
		tableGenerator: tableGeneratorMock,
	} as APICommand<ArgumentsCamelCase<CommandArgs>>
	apiCommandMock.mockResolvedValue(command)

	const defaultInputArgv = {
		profile: 'default',
		status: false,
		health: false,
		verbose: false,
	} as ArgumentsCamelCase<CommandArgs>

	const device1 = { deviceId: 'device-1-id' } as Device
	const device2 = { deviceId: 'device-2-id' } as Device
	const devices = [device1, device2]
	const device1WithLocationAndRoom = { ...device1, location: 'Home' } as OutputDevice
	const device2WithLocationAndRoom = { ...device2, location: 'Garage' } as OutputDevice
	const devicesWithLocationsAndRooms = [device1WithLocationAndRoom, device2WithLocationAndRoom]

	it('lists devices without args', async () => {
		await expect(cmd.handler(defaultInputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(defaultInputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({
				primaryKeyName: 'deviceId',
				listTableFieldDefinitions: expect.not.arrayContaining(['location', 'room']),
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		const listFunction = outputItemOrListMock.mock.calls[0][3]
		apiDevicesListMock.mockResolvedValueOnce(devices)

		expect(await listFunction()).toBe(devices)

		expect(apiDevicesListMock).toHaveBeenCalledExactlyOnceWith({
			capability: undefined,
			capabilitiesMode: 'and',
			locationId: undefined,
			deviceId: undefined,
			installedAppId: undefined,
			type: undefined,
			includeHealth: false,
			includeStatus: false,
		})
	})

	it('lists details of a specified device', async () => {
		const inputArgv = { ...defaultInputArgv, idOrIndex: 'device-from-arg' } as ArgumentsCamelCase<CommandArgs>

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({ primaryKeyName: 'deviceId' }),
			'device-from-arg',
			expect.any(Function),
			expect.any(Function),
		)

		const getFunction = outputItemOrListMock.mock.calls[0][4]
		apiDevicesGetMock.mockResolvedValueOnce(device1)

		expect(await getFunction('chosen-device-id')).toStrictEqual(device1)

		expect(apiDevicesGetMock).toHaveBeenCalledWith('chosen-device-id', { includeStatus: false })

		buildTableOutputMock.mockReturnValueOnce('build table output')
		const config = outputItemOrListMock.mock.calls[0][1] as
			CustomCommonOutputProducer<OutputDevice>
		expect(config.buildTableOutput(device1)).toBe('build table output')
		expect(buildTableOutputMock).toHaveBeenCalledExactlyOnceWith(tableGeneratorMock, device1)
	})

	it('includes location and room names in list with --verbose flag', async () => {
		const inputArgv = { ...defaultInputArgv, verbose: true } as ArgumentsCamelCase<CommandArgs>

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({
				listTableFieldDefinitions: expect.arrayContaining(['location', 'room']),
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		const listFunction = outputItemOrListMock.mock.calls[0][3]
		apiDevicesListMock.mockResolvedValueOnce(devices)
		withLocationsAndRoomsMock.mockResolvedValueOnce(devicesWithLocationsAndRooms)

		expect(await listFunction()).toBe(devicesWithLocationsAndRooms)

		expect(withLocationsAndRoomsMock).toHaveBeenCalledExactlyOnceWith(clientMock, devices)
	})

	it('includes location and room names for single device with --verbose flag', async () => {
		const inputArgv = {
			...defaultInputArgv,
			verbose: true,
			idOrIndex: 'device-from-cmd-line',
		} as ArgumentsCamelCase<CommandArgs>

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		const getFunction = outputItemOrListMock.mock.calls[0][4]
		apiDevicesGetMock.mockResolvedValueOnce(device1)
		withLocationAndRoomMock.mockResolvedValueOnce(device1WithLocationAndRoom)

		expect(await getFunction('chosen-device-id')).toStrictEqual(device1WithLocationAndRoom)

		expect(apiDevicesGetMock).toHaveBeenCalledWith('chosen-device-id', { includeStatus: false })
		expect(withLocationAndRoomMock).toHaveBeenCalledExactlyOnceWith(clientMock, device1)
	})

	it('includes health information with --health flag', async () => {
		const inputArgv = { ...defaultInputArgv, health: true } as ArgumentsCamelCase<CommandArgs>

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({
				listTableFieldDefinitions: expect.arrayContaining([{
					path: 'healthState.state',
					label: 'Health',
				}]),
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		const listFunction = outputItemOrListMock.mock.calls[0][3]
		apiDevicesListMock.mockResolvedValueOnce(devices)

		expect(await listFunction()).toBe(devices)

		expect(apiDevicesListMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			includeHealth: true,
		}))
	})

	it('includes health information with --health flag with device details', async () => {
		const inputArgv = {
			...defaultInputArgv,
			health: true,
			idOrIndex: 'device-from-cmd-line',
		} as ArgumentsCamelCase<CommandArgs>

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()


		const getFunction = outputItemOrListMock.mock.calls[0][4]
		apiDevicesGetMock.mockResolvedValueOnce(device1)
		const healthState = { state: DeviceHealthState.ONLINE } as DeviceHealth
		const device1WithHealth = { ...device1, healthState }
		apiDevicesGetHealthMock.mockResolvedValueOnce(healthState)

		expect(await getFunction('chosen-device-id')).toStrictEqual(device1WithHealth)

		expect(apiDevicesGetMock).toHaveBeenCalledWith('chosen-device-id', { includeStatus: false })
		expect(apiDevicesGetHealthMock).toHaveBeenCalledExactlyOnceWith('chosen-device-id')

		buildTableOutputMock.mockReturnValueOnce('build table output')
		const config = outputItemOrListMock.mock.calls[0][1] as
			CustomCommonOutputProducer<OutputDevice>
		expect(config.buildTableOutput(device1)).toBe('build table output')
		expect(buildTableOutputMock).toHaveBeenCalledExactlyOnceWith(tableGeneratorMock, device1)
	})

	it('passes other flags on to devices get and list endpoints appropriately', async () => {
		const inputArgv = {
			...defaultInputArgv,
			location: ['location-from-cmd-line'],
			capability: ['capability-from-cmd-line'],
			capabilitiesMode: 'or',
			device: ['device-filter-from-cmd-line'],
			installedApp: 'installed-app-from-cmd-line',
			status: true,
			type: [DeviceIntegrationType.MATTER, DeviceIntegrationType.ZIGBEE],
		} as ArgumentsCamelCase<CommandArgs>

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		expect(apiCommandMock).toHaveBeenCalledExactlyOnceWith(inputArgv)
		expect(outputItemOrListMock).toHaveBeenCalledExactlyOnceWith(
			command,
			expect.objectContaining({
				primaryKeyName: 'deviceId',
				listTableFieldDefinitions: expect.not.arrayContaining(['location', 'room']),
			}),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		const listFunction = outputItemOrListMock.mock.calls[0][3]
		apiDevicesListMock.mockResolvedValueOnce(devices)

		expect(await listFunction()).toBe(devices)

		expect(apiDevicesListMock).toHaveBeenCalledExactlyOnceWith({
			capability: ['capability-from-cmd-line'],
			capabilitiesMode: 'or',
			locationId: ['location-from-cmd-line'],
			deviceId: ['device-filter-from-cmd-line'],
			installedAppId: 'installed-app-from-cmd-line',
			type: [DeviceIntegrationType.MATTER, DeviceIntegrationType.ZIGBEE],
			includeHealth: false,
			includeStatus: true,
		})

		const getFunction = outputItemOrListMock.mock.calls[0][4]
		apiDevicesGetMock.mockResolvedValueOnce(device1)

		expect(await getFunction('chosen-device-id')).toStrictEqual(device1)

		expect(apiDevicesGetMock).toHaveBeenCalledWith('chosen-device-id', { includeStatus: true })
	})
})
