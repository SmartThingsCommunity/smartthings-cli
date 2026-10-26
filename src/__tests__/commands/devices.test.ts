import { jest } from '@jest/globals'

import type { ArgumentsCamelCase, Argv, Options } from 'yargs'

import {
	type Device,
	type DeviceHealth,
	type DeviceListOptions,
	DeviceHealthState,
	DeviceIntegrationType,
	DevicesEndpoint,
	type SmartThingsClient,
} from '@smartthings/core-sdk'

import type { CommandArgs, OutputDevice } from '../../commands/devices.js'
import type { withLocationAndRoom, withLocationsAndRooms } from '../../lib/api-helpers.js'
import type { buildEpilog } from '../../lib/help.js'
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

const buildEpilogMock = jest.fn<typeof buildEpilog>()
jest.unstable_mockModule('../../lib/help.js', () => ({
	buildEpilog: buildEpilogMock,
}))

const { apiCommandMock, apiCommandBuilderMock } = apiCommandMocks()

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
	const optionFor = (name: string): Options | undefined =>
		(optionMock as OptionMock).mock.calls.find(([key]) => key === name)?.[1]

	it('calls correct parent and yargs functions', () => {
		expect(builder(yargsMock)).toBe(argvMock)

		expect(apiCommandBuilderMock).toHaveBeenCalledTimes(1)
		expect(apiCommandBuilderMock).toHaveBeenCalledWith(yargsMock)
		expect(outputItemOrListBuilderMock).toHaveBeenCalledTimes(1)
		expect(outputItemOrListBuilderMock).toHaveBeenCalledWith(apiCommandBuilderArgvMock)
		expect(positionalMock).toHaveBeenCalledTimes(1)
		expect(optionMock).toHaveBeenCalledTimes(10)
		expect(exampleMock).toHaveBeenCalledTimes(1)
		expect(buildEpilogMock).toHaveBeenCalledTimes(1)
		expect(epilogMock).toHaveBeenCalledTimes(1)
	})

	// A simplified version of the type of the `Argv.option` that matches the way we call it.
	type OptionMock = jest.Mock<(key: string, options?: Options) => Argv<object & APICommandFlags>>

	it('accepts upper or lowercase types', () => {
		expect(builder(yargsMock)).toBe(argvMock)

		const typeCoerce = optionFor('type')?.coerce
		expect(typeCoerce).toBeDefined()
		expect(typeCoerce?.(['ZIGBEE', 'zwave']))
			.toStrictEqual([DeviceIntegrationType.ZIGBEE, DeviceIntegrationType.ZWAVE])
		expect(typeCoerce?.(['zigbee', 'ZWAVE']))
			.toStrictEqual([DeviceIntegrationType.ZIGBEE, DeviceIntegrationType.ZWAVE])
	})

	it('adds long-form --hub and preserves -H for --health', () => {
		expect(builder(yargsMock)).toBe(argvMock)

		expect(optionFor('hub')).toEqual(expect.objectContaining({
			describe: 'filter results by hub',
			type: 'string',
		}))
		expect(optionFor('hub')).not.toHaveProperty('alias')
		expect(optionFor('health')).toEqual(expect.objectContaining({ alias: 'H' }))
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
	beforeEach(() => apiDevicesListMock.mockReset())

	const defaultInputArgv = {
		profile: 'default',
		status: false,
		health: false,
		verbose: false,
	} as ArgumentsCamelCase<CommandArgs>
	const selectedHubId = 'selected-hub-id'
	const otherHubId = 'other-hub-id'
	const selectedHub = {
		deviceId: selectedHubId,
		label: 'Selected Hub',
		type: DeviceIntegrationType.HUB,
	} as Device
	const otherHub = {
		deviceId: otherHubId,
		label: 'Other Hub',
		type: DeviceIntegrationType.HUB,
	} as Device

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
		const inputArgv = {
			...defaultInputArgv,
			hub: selectedHubId,
			idOrIndex: 'device-from-arg',
		} as ArgumentsCamelCase<CommandArgs>

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
		expect(apiDevicesListMock).not.toHaveBeenCalled()

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

	it('filters all supported direct hub-id integrations using the declared device type', async () => {
		const directDevices = [
			{ deviceId: 'dth-device', label: 'DTH Device', type: DeviceIntegrationType.DTH,
				dth: { hubId: selectedHubId } },
			{ deviceId: 'lan-device', label: 'LAN Device', type: DeviceIntegrationType.LAN,
				lan: { hubId: selectedHubId } },
			{ deviceId: 'zigbee-device', label: 'Zigbee Device', type: DeviceIntegrationType.ZIGBEE,
				zigbee: { hubId: selectedHubId } },
			{ deviceId: 'zwave-device', label: 'Z-Wave Device', type: DeviceIntegrationType.ZWAVE,
				zwave: { hubId: selectedHubId } },
			{ deviceId: 'matter-device', label: 'Matter Device', type: DeviceIntegrationType.MATTER,
				matter: { hubId: selectedHubId } },
			{ deviceId: 'edge-child-device', label: 'Edge Child Device', type: DeviceIntegrationType.EDGE_CHILD,
				edgeChild: { hubId: selectedHubId } },
			{ deviceId: 'virtual-device', label: 'Virtual Device', type: DeviceIntegrationType.VIRTUAL,
				virtual: { hubId: selectedHubId } },
		] as unknown as Device[]
		const deviceOnOtherHub = {
			deviceId: 'other-hub-device',
			label: 'Other Hub Device',
			type: DeviceIntegrationType.ZIGBEE,
			zigbee: { hubId: otherHubId },
		} as unknown as Device
		const deviceWithIrrelevantHubField = {
			deviceId: 'irrelevant-hub-field-device',
			label: 'Irrelevant Hub Field Device',
			type: DeviceIntegrationType.LAN,
			lan: {},
			zigbee: { hubId: selectedHubId },
		} as unknown as Device
		const inputArgv = { ...defaultInputArgv, hub: selectedHubId } as ArgumentsCamelCase<CommandArgs>

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		const listFunction = outputItemOrListMock.mock.calls[0][3]
		apiDevicesListMock.mockResolvedValueOnce([
			selectedHub,
			...directDevices,
			otherHub,
			deviceOnOtherHub,
			deviceWithIrrelevantHubField,
		])

		expect(await listFunction()).toStrictEqual(directDevices)
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

	it('treats declared-type hub ownership as authoritative over ancestry', async () => {
		const selectedDespiteOtherParent = {
			deviceId: 'selected-despite-other-parent',
			label: 'Selected Despite Other Parent',
			type: DeviceIntegrationType.ZIGBEE,
			parentDeviceId: otherHubId,
			zigbee: { hubId: selectedHubId },
		} as unknown as Device
		const excludedDespiteSelectedParent = {
			deviceId: 'excluded-despite-selected-parent',
			label: 'Excluded Despite Selected Parent',
			type: DeviceIntegrationType.LAN,
			parentDeviceId: selectedHubId,
			lan: { hubId: otherHubId },
			zigbee: { hubId: selectedHubId },
		} as unknown as Device
		const inputArgv = { ...defaultInputArgv, hub: selectedHubId } as ArgumentsCamelCase<CommandArgs>

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		const listFunction = outputItemOrListMock.mock.calls[0][3]
		apiDevicesListMock.mockResolvedValueOnce([
			selectedHub,
			otherHub,
			selectedDespiteOtherParent,
			excludedDespiteSelectedParent,
		])

		expect(await listFunction()).toStrictEqual([selectedDespiteOtherParent])
	})

	it('handles nested ancestry, missing parents, cycles, and duplicate devices safely', async () => {
		const directDevice = {
			deviceId: 'direct-device',
			label: 'Direct Device',
			type: DeviceIntegrationType.LAN,
			lan: { hubId: selectedHubId },
		} as unknown as Device
		const intermediateDevice = {
			deviceId: 'intermediate-device',
			label: 'Intermediate Device',
			type: DeviceIntegrationType.EDGE_CHILD,
			parentDeviceId: selectedHubId,
			edgeChild: {},
		} as unknown as Device
		const nestedDevice = {
			deviceId: 'nested-device',
			label: 'Nested Device',
			type: DeviceIntegrationType.EDGE_CHILD,
			parentDeviceId: intermediateDevice.deviceId,
			edgeChild: {},
		} as unknown as Device
		const otherHubChild = {
			deviceId: 'other-hub-child',
			label: 'Other Hub Child',
			type: DeviceIntegrationType.EDGE_CHILD,
			parentDeviceId: otherHubId,
			edgeChild: {},
		} as unknown as Device
		const missingParentDevice = {
			deviceId: 'missing-parent-device',
			label: 'Missing Parent Device',
			type: DeviceIntegrationType.EDGE_CHILD,
			parentDeviceId: 'missing-parent-id',
			edgeChild: {},
		} as unknown as Device
		const cycleA = {
			deviceId: 'cycle-a',
			label: 'Cycle A',
			type: DeviceIntegrationType.EDGE_CHILD,
			parentDeviceId: 'cycle-b',
			edgeChild: {},
		} as unknown as Device
		const cycleB = {
			deviceId: 'cycle-b',
			label: 'Cycle B',
			type: DeviceIntegrationType.EDGE_CHILD,
			parentDeviceId: 'cycle-a',
			edgeChild: {},
		} as unknown as Device
		const duplicateFirst = {
			deviceId: 'duplicate-device',
			label: 'Duplicate First',
			type: DeviceIntegrationType.EDGE_CHILD,
			parentDeviceId: selectedHubId,
			edgeChild: {},
		} as unknown as Device
		const duplicateSecond = { ...duplicateFirst, label: 'Duplicate Second' }
		const inputArgv = { ...defaultInputArgv, hub: selectedHubId } as ArgumentsCamelCase<CommandArgs>

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		const listFunction = outputItemOrListMock.mock.calls[0][3]
		apiDevicesListMock.mockResolvedValueOnce([
			selectedHub,
			directDevice,
			intermediateDevice,
			nestedDevice,
			otherHub,
			otherHubChild,
			missingParentDevice,
			cycleA,
			cycleB,
			duplicateFirst,
			duplicateSecond,
		])

		expect(await listFunction()).toStrictEqual([
			directDevice,
			intermediateDevice,
			nestedDevice,
			duplicateFirst,
		])
		expect(apiDevicesListMock).toHaveBeenCalledTimes(1)
	})

	const narrowingFilterCases: [string, Partial<CommandArgs>, Partial<DeviceListOptions>][] = [
		['location', { location: ['location-id'] }, { locationId: ['location-id'] }],
		['capability', { capability: ['switch'], capabilitiesMode: 'or' },
			{ capability: ['switch'], capabilitiesMode: 'or' }],
		['device', { device: ['filtered-leaf-id'] }, { deviceId: ['filtered-leaf-id'] }],
		['installed app', { installedApp: 'installed-app-id' }, { installedAppId: 'installed-app-id' }],
		['type', { type: [DeviceIntegrationType.EDGE_CHILD] }, { type: [DeviceIntegrationType.EDGE_CHILD] }],
	]

	it.each(narrowingFilterCases)('loads complete topology for a %s filter', async (_name, flags, expectedOptions) => {
		const filteredLeaf = {
			deviceId: 'filtered-leaf-id',
			label: 'Filtered Leaf',
			type: DeviceIntegrationType.EDGE_CHILD,
			edgeChild: {},
			healthState: { state: DeviceHealthState.ONLINE },
		} as unknown as OutputDevice
		const topologyIntermediate = {
			deviceId: 'topology-intermediate-id',
			label: 'Topology Intermediate',
			type: DeviceIntegrationType.EDGE_CHILD,
			parentDeviceId: selectedHubId,
			edgeChild: {},
		} as unknown as Device
		const topologyLeaf = {
			deviceId: filteredLeaf.deviceId,
			label: 'Lean Topology Leaf',
			type: DeviceIntegrationType.EDGE_CHILD,
			parentDeviceId: topologyIntermediate.deviceId,
			edgeChild: {},
		} as unknown as Device
		const inputArgv = {
			...defaultInputArgv,
			hub: selectedHubId,
			...flags,
		} as ArgumentsCamelCase<CommandArgs>

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		const listFunction = outputItemOrListMock.mock.calls[0][3]
		apiDevicesListMock
			.mockResolvedValueOnce([filteredLeaf])
			.mockResolvedValueOnce([selectedHub, topologyIntermediate, topologyLeaf])

		const result = await listFunction()
		expect(result).toStrictEqual([filteredLeaf])
		expect(result[0]).toBe(filteredLeaf)
		expect(apiDevicesListMock).toHaveBeenCalledTimes(2)
		expect(apiDevicesListMock).toHaveBeenNthCalledWith(1, {
			capability: undefined,
			capabilitiesMode: 'and',
			locationId: undefined,
			deviceId: undefined,
			installedAppId: undefined,
			type: undefined,
			includeHealth: false,
			includeStatus: false,
			...expectedOptions,
		})
		expect(apiDevicesListMock.mock.calls[1]).toStrictEqual([])
	})

	it('uses the hub-filtered list for a numeric index without extra health or status topology calls', async () => {
		const matchingDevice = {
			deviceId: 'matching-index-device',
			label: 'Matching Index Device',
			type: DeviceIntegrationType.MATTER,
			matter: { hubId: selectedHubId },
		} as unknown as Device
		const otherDevice = {
			deviceId: 'other-index-device',
			label: 'Other Index Device',
			type: DeviceIntegrationType.MATTER,
			matter: { hubId: otherHubId },
		} as unknown as Device
		const inputArgv = {
			...defaultInputArgv,
			hub: selectedHubId,
			health: true,
			status: true,
			idOrIndex: '1',
		} as ArgumentsCamelCase<CommandArgs>

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()
		expect(outputItemOrListMock.mock.calls[0][2]).toBe('1')

		const listFunction = outputItemOrListMock.mock.calls[0][3]
		apiDevicesListMock.mockResolvedValueOnce([selectedHub, matchingDevice, otherDevice])

		expect(await listFunction()).toStrictEqual([matchingDevice])
		expect(apiDevicesListMock).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
			includeHealth: true,
			includeStatus: true,
		}))
	})

	it('adds verbose location data only after filtering devices by hub', async () => {
		const matchingDevice = {
			deviceId: 'matching-verbose-device',
			label: 'Matching Verbose Device',
			type: DeviceIntegrationType.ZIGBEE,
			zigbee: { hubId: selectedHubId },
		} as unknown as Device
		const otherDevice = {
			deviceId: 'other-verbose-device',
			label: 'Other Verbose Device',
			type: DeviceIntegrationType.ZIGBEE,
			zigbee: { hubId: otherHubId },
		} as unknown as Device
		const matchingDeviceWithLocation = { ...matchingDevice, location: 'Home' } as OutputDevice
		const inputArgv = {
			...defaultInputArgv,
			hub: selectedHubId,
			verbose: true,
		} as ArgumentsCamelCase<CommandArgs>

		await expect(cmd.handler(inputArgv)).resolves.not.toThrow()

		const listFunction = outputItemOrListMock.mock.calls[0][3]
		apiDevicesListMock.mockResolvedValueOnce([matchingDevice, otherDevice])
		withLocationsAndRoomsMock.mockResolvedValueOnce([matchingDeviceWithLocation])

		expect(await listFunction()).toStrictEqual([matchingDeviceWithLocation])
		expect(withLocationsAndRoomsMock).toHaveBeenCalledExactlyOnceWith(clientMock, [matchingDevice])
	})
})
