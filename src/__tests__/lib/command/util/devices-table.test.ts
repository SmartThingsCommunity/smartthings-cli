import type { Device, DeviceStatus, HubDeviceDetails, MatterDeviceDetails } from '@smartthings/core-sdk'

import {
	defaultTableGenerator,
	type TableFieldDefinition,
	type ValueTableFieldDefinition,
} from '../../../../lib/table-generator.js'
import {
	buildTableFromItemMock,
	tableGeneratorMock,
	tablePushMock,
	tableToStringMock,
} from '../../../test-lib/table-mock.js'


const {
	buildComponentStatusTableOutput,
	buildEmbeddedStatusTableOutput,
	buildStatusTableOutput,
	buildTableOutput,
} = await import('../../../../lib/command/util/devices-table.js')


describe('buildEmbeddedStatusTableOutput', () => {
	it('handles a single component', () => {
		const device = {
			components: [
				{
					id: 'main',
					capabilities: [
						{
							id: 'switch',
							status: {
								switch: {
									value: 'off',
								},
							},
						},
					],
				},
			],
		} as unknown as Device

		tableToStringMock.mockReturnValueOnce('main component status')

		expect(buildEmbeddedStatusTableOutput(tableGeneratorMock, device))
			.toEqual('main component status')

		expect(tablePushMock).toHaveBeenCalledTimes(1)
		expect(tablePushMock).toHaveBeenCalledWith(['switch', 'switch', '"off"'])
	})

	it('handles multiple components', () => {
		const device = {
			components: [
				{
					id: 'main',
					capabilities: [
						{
							id: 'switch',
							status: {
								switch: {
									value: 'off',
								},
							},
						},
					],
				},
				{
					id: 'light',
					capabilities: [
						{
							id: 'switchLevel',
							status: {
								level: {
									value: 80,
								},
							},
						},
					],
				},
			],
		} as unknown as Device

		tableToStringMock.mockReturnValueOnce('main component status')
		tableToStringMock.mockReturnValueOnce('light component status')

		expect(buildEmbeddedStatusTableOutput(tableGeneratorMock, device))
			.toEqual('main component\nmain component status\nlight component\nlight component status')

		expect(tablePushMock).toHaveBeenCalledTimes(2)
		expect(tablePushMock).toHaveBeenNthCalledWith(1, ['switch', 'switch', '"off"'])
		expect(tablePushMock).toHaveBeenNthCalledWith(2, ['switchLevel', 'level', '80'])
	})
})

describe('buildTableOutput', () => {
	const baseDevice = {
		name: 'device name',
		type: 'device type',
		deviceId: 'device-id',
		label: 'device label',
		deviceManufacturerCode: 'device-manufacturer-code',
		manufacturerName: 'manufacturer-name',
		locationId: 'location-id',
		roomId: 'room-id',
		components: [{ id: 'main', capabilities: [{ id: 'capability-id' }] }],
		childDevices: [{ id: 'child-id' }],
		profile: { id: 'device-profile-id' },
	} as unknown as Device
	it('includes all main fields', () => {
		tableToStringMock.mockReturnValueOnce('main table')

		expect(buildTableOutput(tableGeneratorMock, baseDevice))
			.toEqual('Main Info\nmain table')

		expect(tablePushMock).toHaveBeenCalledTimes(10)
		expect(tablePushMock).toHaveBeenCalledWith(['Label', 'device label'])
		expect(tablePushMock).toHaveBeenCalledWith(['Name', 'device name'])
		expect(tablePushMock).toHaveBeenCalledWith(['Id', 'device-id'])
		expect(tablePushMock).toHaveBeenCalledWith(['Type', 'device type'])
		expect(tablePushMock).toHaveBeenCalledWith(['Manufacturer Code', 'device-manufacturer-code'])
		expect(tablePushMock).toHaveBeenCalledWith(['Location Id', 'location-id'])
		expect(tablePushMock).toHaveBeenCalledWith(['Room Id', 'room-id'])
		expect(tablePushMock).toHaveBeenCalledWith(['Profile Id', 'device-profile-id'])
		expect(tablePushMock).toHaveBeenCalledWith(['Capabilities', 'capability-id'])
		expect(tablePushMock).toHaveBeenCalledWith(['Child Devices', 'child-id'])
		expect(tableToStringMock).toHaveBeenCalledTimes(2)
	})

	it('includes multiple components', () => {
		const device = {
			...baseDevice,
			components: [
				{ id: 'main', capabilities: [{ id: 'capability-id' }] },
				{ id: 'compName', capabilities: [{ id: 'capability-id' }] },
			],
		} as Device
		tableToStringMock.mockReturnValueOnce('main table')

		expect(buildTableOutput(tableGeneratorMock, device))
			.toEqual('Main Info\nmain table')

		expect(tablePushMock).toHaveBeenCalledWith(['Capabilities', 'capability-id'])
		expect(tablePushMock).toHaveBeenCalledWith(['Capabilities (compName)', 'capability-id'])
	})

	it('joins multiple component capabilities with newlines', () => {
		const device = {
			...baseDevice,
			components: [
				{ id: 'main', capabilities: [{ id: 'capability-1' }, { id: 'capability-2' }] },
			],
		} as Device
		tableToStringMock.mockReturnValueOnce('main table')

		expect(buildTableOutput(tableGeneratorMock, device))
			.toEqual('Main Info\nmain table')

		expect(tablePushMock).toHaveBeenCalledWith(['Capabilities', 'capability-1\ncapability-2'])
	})

	it('joins multiple children with newlines', () => {
		const device = {
			...baseDevice,
			childDevices: [{ id: 'child-id-1' }, { id: 'child-id-2' }],
		} as Device
		tableToStringMock.mockReturnValueOnce('main table')

		expect(buildTableOutput(tableGeneratorMock, device))
			.toEqual('Main Info\nmain table')

		expect(tablePushMock).toHaveBeenCalledWith(['Child Devices', 'child-id-1\nchild-id-2'])
	})

	it('handles old style profile id', () => {
		const device = {
			profileId: 'device-profile-id',
		} as unknown as Device
		tableToStringMock.mockReturnValueOnce('main table')

		expect(buildTableOutput(tableGeneratorMock, device))
			.toEqual('Main Info\nmain table')

		expect(tablePushMock).toHaveBeenCalledTimes(8)
		expect(tablePushMock).toHaveBeenCalledWith(['Profile Id', 'device-profile-id'])
	})

	it('defaults optional fields to empty strings', () => {
		const device = {} as unknown as Device
		tableToStringMock.mockReturnValueOnce('main table')

		expect(buildTableOutput(tableGeneratorMock, device))
			.toEqual('Main Info\nmain table')

		expect(tablePushMock).toHaveBeenCalledTimes(8)
		expect(tablePushMock).toHaveBeenCalledWith(['Manufacturer Code', ''])
		expect(tablePushMock).toHaveBeenCalledWith(['Location Id', ''])
		expect(tablePushMock).toHaveBeenCalledWith(['Room Id', ''])
		expect(tablePushMock).toHaveBeenCalledWith(['Profile Id', ''])
	})

	it('displays health state', () => {
		const device = {
			healthState: {
				state: 'ONLINE',
				lastUpdatedDate: '2022-07-28T14:50:42.899Z',
			},
		} as unknown as Device
		tableToStringMock.mockReturnValueOnce('main table')

		expect(buildTableOutput(tableGeneratorMock, device))
			.toEqual('Main Info\nmain table')

		expect(tablePushMock).toHaveBeenCalledTimes(10)
		expect(tablePushMock).toHaveBeenCalledWith(['Device Health', 'ONLINE'])
		expect(tablePushMock).toHaveBeenCalledWith(['Last Updated', '2022-07-28T14:50:42.899Z'])
	})

	it('displays location and room names', () => {
		const verboseDevice = {
			room: 'room-name',
			location: 'location-name',
		} as unknown as Device
		tableToStringMock.mockReturnValueOnce('main table')

		expect(buildTableOutput(tableGeneratorMock, verboseDevice))
			.toEqual('Main Info\nmain table')

		expect(tablePushMock).toHaveBeenCalledTimes(10)
		expect(tablePushMock).toHaveBeenCalledWith(['Room', 'room-name'])
		expect(tablePushMock).toHaveBeenCalledWith(['Location', 'location-name'])
	})

	it('displays device status', () => {
		const device = {
			components: [
				{
					id: 'main',
					capabilities: [
						{
							id: 'capability-id',
							status: {
								switch: {
									value: 'off',
								},
							},
						},
					],
				},
			],
		} as unknown as Device
		tableToStringMock.mockReturnValueOnce('main table')
		tableToStringMock.mockReturnValueOnce('device status')

		expect(buildTableOutput(tableGeneratorMock, device))
			.toEqual('Main Info\nmain table\n\nDevice Status\ndevice status')

		expect(tablePushMock).toHaveBeenCalledTimes(10)
		expect(tableToStringMock).toHaveBeenCalledTimes(2)
	})

	it('includes app info', () => {
		const app = { installedAppId: 'installed-app-id' }
		const device = { app } as unknown as Device
		tableToStringMock.mockReturnValueOnce('main table')
		buildTableFromItemMock.mockReturnValue('app info')

		expect(buildTableOutput(tableGeneratorMock, device))
			.toEqual('Main Info\nmain table\n\nDevice Integration Info (from app)\napp info')

		expect(tablePushMock).toHaveBeenCalledTimes(8)
		expect(buildTableFromItemMock).toHaveBeenCalledTimes(1)
		expect(buildTableFromItemMock).toHaveBeenCalledWith(app,
			['installedAppId', 'externalId', { path: 'profile.id', label: 'Profile Id' }])
	})

	it('includes ble info', () => {
		const ble = { thisIs: 'a ble device' }
		const device = { ble } as unknown as Device
		tableToStringMock.mockReturnValueOnce('main table')

		expect(buildTableOutput(tableGeneratorMock, device))
			.toEqual('Main Info\nmain table\n\nDevice Integration Info (from ble)\n' +
				'No Device Integration Info for BLE devices')

		expect(tablePushMock).toHaveBeenCalledTimes(8)
		expect(buildTableFromItemMock).toHaveBeenCalledTimes(0)
	})

	it('includes bleD2D info', () => {
		const bleD2D = { identifier: 'bleD2D-device' }
		const device = { bleD2D } as unknown as Device
		tableToStringMock.mockReturnValueOnce('main table')
		buildTableFromItemMock.mockReturnValue('bleD2D info')

		expect(buildTableOutput(tableGeneratorMock, device))
			.toEqual('Main Info\nmain table\n\nDevice Integration Info (from bleD2D)\nbleD2D info')

		expect(tablePushMock).toHaveBeenCalledTimes(8)
		expect(buildTableFromItemMock).toHaveBeenCalledTimes(1)
		expect(buildTableFromItemMock).toHaveBeenCalledWith(bleD2D,
			['advertisingId', 'identifier', 'configurationVersion', 'configurationUrl'])
	})

	it('includes dth info', () => {
		const dth = { deviceTypeName: 'dth-device' }
		const device = { dth } as unknown as Device
		tableToStringMock.mockReturnValueOnce('main table')
		buildTableFromItemMock.mockReturnValue('dth info')

		expect(buildTableOutput(tableGeneratorMock, device))
			.toEqual('Main Info\nmain table\n\nDevice Integration Info (from dth)\ndth info')

		expect(tablePushMock).toHaveBeenCalledTimes(8)
		expect(buildTableFromItemMock).toHaveBeenCalledTimes(1)
		expect(buildTableFromItemMock).toHaveBeenCalledWith(dth,
			['deviceTypeId', 'deviceTypeName', 'completedSetup', 'deviceNetworkType',
				'executingLocally', 'hubId', 'installedGroovyAppId', 'networkSecurityLevel'])
	})

	it('includes lan info', () => {
		const lan = { networkId: 'lan-device' }
		const device = { lan } as unknown as Device
		tableToStringMock.mockReturnValueOnce('main table')
		buildTableFromItemMock.mockReturnValue('lan info')

		expect(buildTableOutput(tableGeneratorMock, device))
			.toEqual('Main Info\nmain table\n\nDevice Integration Info (from lan)\nlan info')

		expect(tablePushMock).toHaveBeenCalledTimes(8)
		expect(buildTableFromItemMock).toHaveBeenCalledTimes(1)
		expect(buildTableFromItemMock).toHaveBeenCalledWith(lan,
			['networkId', 'driverId', 'executingLocally', 'hubId', 'provisioningState'])
	})

	it('includes zigbee info', () => {
		const zigbee = { networkId: 'zigbee-device' }
		const device = { zigbee } as unknown as Device
		tableToStringMock.mockReturnValueOnce('main table')
		buildTableFromItemMock.mockReturnValue('zigbee info')

		expect(buildTableOutput(tableGeneratorMock, device))
			.toEqual('Main Info\nmain table\n\nDevice Integration Info (from zigbee)\nzigbee info')

		expect(tablePushMock).toHaveBeenCalledTimes(8)
		expect(buildTableFromItemMock).toHaveBeenCalledTimes(1)
		expect(buildTableFromItemMock).toHaveBeenCalledWith(zigbee,
			['eui', 'networkId', 'driverId', 'executingLocally', 'hubId', 'provisioningState'])
	})

	it('includes zwave info', () => {
		const zwave = { networkId: 'zwave-device' }
		const device = { zwave } as unknown as Device
		tableToStringMock.mockReturnValueOnce('main table')
		buildTableFromItemMock.mockReturnValue('zwave info')

		expect(buildTableOutput(tableGeneratorMock, device))
			.toEqual('Main Info\nmain table\n\nDevice Integration Info (from zwave)\nzwave info')

		expect(tablePushMock).toHaveBeenCalledTimes(8)
		expect(buildTableFromItemMock).toHaveBeenCalledTimes(1)
		expect(buildTableFromItemMock).toHaveBeenCalledWith(zwave,
			['networkId', 'driverId', 'executingLocally', 'hubId', 'networkSecurityLevel', 'provisioningState'])
	})

	describe('matter info', () => {
		const matter = { driverId: 'matter-driver-id' }
		const device = { matter } as unknown as Device

		it('includes basic info', () => {
			tableToStringMock.mockReturnValueOnce('main table')
			buildTableFromItemMock.mockReturnValue('matter info')

			expect(buildTableOutput(tableGeneratorMock, device))
				.toEqual('Main Info\nmain table\n\nDevice Integration Info (from matter)\nmatter info')

			expect(tablePushMock).toHaveBeenCalledTimes(8)
			expect(buildTableFromItemMock).toHaveBeenCalledTimes(1)
			expect(buildTableFromItemMock).toHaveBeenCalledWith(matter, expect.arrayContaining([
				'driverId', 'hubId', 'provisioningState', 'networkId', 'executingLocally', 'uniqueId',
				'vendorId', 'supportedNetworkInterfaces',
				{ label: 'Hardware Version', value: expect.any(Function) },
				{ label: 'Software Version', value: expect.any(Function) },
				{ label: 'Endpoints', value: expect.any(Function) },
			]))
		})

		test.each`
			hardwareLabel | hardware     | expected
			${undefined}  | ${undefined} | ${'n/a (n/a)'}
			${'1.0.0'}    | ${undefined} | ${'1.0.0 (n/a)'}
			${undefined}  | ${72}        | ${'n/a (72)'}
			${'1.0.0'}    | ${72}        | ${'1.0.0 (72)'}
		`('hardware version function maps label "$hardwareLabel" and version "$hardware" to "$expected"', (
				{ hardwareLabel, hardware, expected },
		) => {
			tableToStringMock.mockReturnValueOnce('main table')
			buildTableFromItemMock.mockReturnValue('matter info')

			expect(buildTableOutput(tableGeneratorMock, device))
				.toEqual('Main Info\nmain table\n\nDevice Integration Info (from matter)\nmatter info')

			const tableDefinitions = buildTableFromItemMock.mock.calls[0][1] as
				TableFieldDefinition<MatterDeviceDetails>[]
			const hardwareVersionFunc = (tableDefinitions[8] as
				ValueTableFieldDefinition<MatterDeviceDetails>).value

			const matterDeviceDetails = { version: { hardwareLabel, hardware } } as MatterDeviceDetails
			expect(hardwareVersionFunc(matterDeviceDetails)).toBe(expected)
		})

		test('hardware version function maps undefined version to "n/a"', () => {
			tableToStringMock.mockReturnValueOnce('main table')
			buildTableFromItemMock.mockReturnValue('matter info')

			expect(buildTableOutput(tableGeneratorMock, device))
				.toEqual('Main Info\nmain table\n\nDevice Integration Info (from matter)\nmatter info')

			const tableDefinitions = buildTableFromItemMock.mock.calls[0][1] as
				TableFieldDefinition<MatterDeviceDetails>[]
			const hardwareVersionFunc = (tableDefinitions[8] as
				ValueTableFieldDefinition<MatterDeviceDetails>).value

			const matterDeviceDetails = {} as MatterDeviceDetails
			expect(hardwareVersionFunc(matterDeviceDetails)).toBe('n/a')
		})

		test.each`
			softwareLabel | software     | expected
			${undefined}  | ${undefined} | ${'n/a (n/a)'}
			${'1.0.0'}    | ${undefined} | ${'1.0.0 (n/a)'}
			${undefined}  | ${72}        | ${'n/a (72)'}
			${'1.0.0'}    | ${72}        | ${'1.0.0 (72)'}
		`('software version function maps label "$softwareLabel" and version "$software" to "$expected"', (
				{ softwareLabel, software, expected },
		) => {
			tableToStringMock.mockReturnValueOnce('main table')
			buildTableFromItemMock.mockReturnValue('matter info')

			expect(buildTableOutput(tableGeneratorMock, device))
				.toEqual('Main Info\nmain table\n\nDevice Integration Info (from matter)\nmatter info')

			const tableDefinitions = buildTableFromItemMock.mock.calls[0][1] as
				TableFieldDefinition<MatterDeviceDetails>[]
			const softwareVersionFunc = (tableDefinitions[9] as
				ValueTableFieldDefinition<MatterDeviceDetails>).value

			const matterDeviceDetails = { version: { softwareLabel, software } } as MatterDeviceDetails
			expect(softwareVersionFunc(matterDeviceDetails)).toBe(expected)
		})

		test('software version function maps undefined version to "n/a"', () => {
			tableToStringMock.mockReturnValueOnce('main table')
			buildTableFromItemMock.mockReturnValue('matter info')

			expect(buildTableOutput(tableGeneratorMock, device))
				.toEqual('Main Info\nmain table\n\nDevice Integration Info (from matter)\nmatter info')

			const tableDefinitions = buildTableFromItemMock.mock.calls[0][1] as
				TableFieldDefinition<MatterDeviceDetails>[]
			const softwareVersionFunc = (tableDefinitions[9] as
				ValueTableFieldDefinition<MatterDeviceDetails>).value

			const matterDeviceDetails = {} as MatterDeviceDetails
			expect(softwareVersionFunc(matterDeviceDetails)).toBe('n/a')
		})

		test.each`
			desc | endpoints | expected
			${'undefined'}   | ${undefined}                                                                       | ${''}
			${'empty array'} | ${[]}                                                                              | ${''}
			${'no types'}    | ${[{ endpointId: 'id' }]}                                                          | ${'id: '}
			${'empty types'} | ${[{ endpointId: 'id', deviceTypes: [] }]}                                         | ${'id: '}
			${'one type'}    | ${[{ endpointId: 'id', deviceTypes: [{ deviceTypeId: 1 }] }]}                      | ${'id: 1'}
			${'2 types'}     | ${[{ endpointId: 'id', deviceTypes: [{ deviceTypeId: 1 }, { deviceTypeId: 2 }] }]} | ${'id: 1, 2'}
		`('endpoints function maps $desc map to "$expected"', ({ endpoints, expected }) => {
			tableToStringMock.mockReturnValueOnce('main table')
			buildTableFromItemMock.mockReturnValue('matter info')

			expect(buildTableOutput(tableGeneratorMock, device))
				.toEqual('Main Info\nmain table\n\nDevice Integration Info (from matter)\nmatter info')

			const tableDefinitions = buildTableFromItemMock.mock.calls[0][1] as
				TableFieldDefinition<MatterDeviceDetails>[]
			const endpointsFunc = (tableDefinitions[10] as
				ValueTableFieldDefinition<MatterDeviceDetails>).value

			const matterDeviceDetails = { endpoints } as MatterDeviceDetails
			expect(endpointsFunc(matterDeviceDetails)).toBe(expected)
		})
	})

	describe('hub info', () => {
		it('includes basic info', () => {
			const hub = { hubEui: 'hub-eui' }
			const device = { hub } as unknown as Device
			tableToStringMock.mockReturnValueOnce('main table')
			buildTableFromItemMock.mockReturnValue('hub info')

			expect(buildTableOutput(tableGeneratorMock, device))
				.toEqual('Main Info\nmain table\n\nDevice Integration Info (from hub)\nhub info')

			expect(tablePushMock).toHaveBeenCalledTimes(8)
			expect(buildTableFromItemMock).toHaveBeenCalledTimes(1)
			expect(buildTableFromItemMock).toHaveBeenCalledWith(hub, expect.arrayContaining([
				'hubEui', 'firmwareVersion', { path: 'hubData.zwaveS2' },
			]))
		})

		test.each`
			desc             | hubDrivers                                              | expected
			${'empty array'} | ${[]}                                                   | ${''}
			${'one driver'}  | ${[{ driverId: 'driver-1' }]}                           | ${'driver-1'}
			${'two drivers'} | ${[{ driverId: 'driver-1' }, { driverId: 'driver-2' }]} | ${'driver-1\ndriver-2'}
		`('hubDrivers function maps $desc to $expected', ({ hubDrivers, expected }) => {
			const hub = { hubEui: 'hub-eui' }
			const device = { hub } as unknown as Device
			tableToStringMock.mockReturnValueOnce('main table')
			buildTableFromItemMock.mockReturnValue('hub info')

			expect(buildTableOutput(tableGeneratorMock, device))
				.toEqual('Main Info\nmain table\n\nDevice Integration Info (from hub)\nhub info')

			const tableDefinitions = buildTableFromItemMock.mock.calls[0][1] as
				TableFieldDefinition<HubDeviceDetails>[]
			const hubDriversFunc = (tableDefinitions[33] as
				ValueTableFieldDefinition<HubDeviceDetails>).value

			const hubDeviceDetails = { hubDrivers } as HubDeviceDetails
			expect(hubDriversFunc(hubDeviceDetails)).toBe(expected)
		})

	})
	it('includes edgeChild info', () => {
		const edgeChild = { driverId: 'edge-child-driver-id' }
		const device = { edgeChild } as unknown as Device
		tableToStringMock.mockReturnValueOnce('main table')
		buildTableFromItemMock.mockReturnValue('edgeChild info')

		expect(buildTableOutput(tableGeneratorMock, device))
			.toEqual('Main Info\nmain table\n\nDevice Integration Info (from edgeChild)\nedgeChild info')

		expect(tablePushMock).toHaveBeenCalledTimes(8)
		expect(buildTableFromItemMock).toHaveBeenCalledTimes(1)
		expect(buildTableFromItemMock).toHaveBeenCalledWith(edgeChild,
			['driverId', 'hubId', 'provisioningState', 'networkId', 'executingLocally', 'parentAssignedChildKey'])
	})

	it('includes ir info', () => {
		const ir = { irCode: 'ir-device-code' }
		const device = { ir } as unknown as Device
		tableToStringMock.mockReturnValueOnce('main table')
		buildTableFromItemMock.mockReturnValue('ir info')

		expect(buildTableOutput(tableGeneratorMock, device))
			.toEqual('Main Info\nmain table\n\nDevice Integration Info (from ir)\nir info')

		expect(tablePushMock).toHaveBeenCalledTimes(8)
		expect(buildTableFromItemMock).toHaveBeenCalledTimes(1)
		expect(buildTableFromItemMock).toHaveBeenCalledWith(ir,
			['parentDeviceId', 'profileId', 'ocfDeviceType', 'irCode'])
	})

	it('includes irOcf info', () => {
		const irOcf = { irCode: 'ocf-ir-device-code' }
		const device = { irOcf } as unknown as Device
		tableToStringMock.mockReturnValueOnce('main table')
		buildTableFromItemMock.mockReturnValue('ir ocf info')

		expect(buildTableOutput(tableGeneratorMock, device))
			.toEqual('Main Info\nmain table\n\nDevice Integration Info (from irOcf)\nir ocf info')

		expect(tablePushMock).toHaveBeenCalledTimes(8)
		expect(buildTableFromItemMock).toHaveBeenCalledTimes(1)
		expect(buildTableFromItemMock).toHaveBeenCalledWith(irOcf,
			['parentDeviceId', 'profileId', 'ocfDeviceType', 'irCode'])
	})

	it('includes ocf info', () => {
		const ocf = { name: 'OCF Device' }
		const device = { ocf } as unknown as Device
		tableToStringMock.mockReturnValueOnce('main table')
		buildTableFromItemMock.mockReturnValue('ocf info')

		expect(buildTableOutput(tableGeneratorMock, device))
			.toEqual('Main Info\nmain table\n\nDevice Integration Info (from ocf)\nocf info')

		expect(tablePushMock).toHaveBeenCalledTimes(8)
		expect(buildTableFromItemMock).toHaveBeenCalledTimes(1)
		expect(buildTableFromItemMock).toHaveBeenCalledWith(ocf,
			['deviceId', 'ocfDeviceType', 'name', 'specVersion', 'verticalDomainSpecVersion',
				'manufacturerName', 'modelNumber', 'platformVersion', 'platformOS', 'hwVersion',
				'firmwareVersion', 'vendorId', 'vendorResourceClientServerVersion', 'locale'])
	})

	it('includes viper info', () => {
		const viper = { uniqueIdentifier: 'unique-upon-it' }
		const device = { viper } as unknown as Device
		tableToStringMock.mockReturnValueOnce('main table')
		buildTableFromItemMock.mockReturnValue('viper info')

		expect(buildTableOutput(tableGeneratorMock, device))
			.toEqual('Main Info\nmain table\n\nDevice Integration Info (from viper)\nviper info')

		expect(tablePushMock).toHaveBeenCalledTimes(8)
		expect(buildTableFromItemMock).toHaveBeenCalledTimes(1)
		expect(buildTableFromItemMock).toHaveBeenCalledWith(viper,
			['uniqueIdentifier', 'manufacturerName', 'modelName', 'swVersion', 'hwVersion'])
	})

	it('includes virtual device info', () => {
		const virtual = { name: 'Virtual Device' }
		const device = { virtual } as unknown as Device
		tableToStringMock.mockReturnValueOnce('main table')
		buildTableFromItemMock.mockReturnValue('virtual device info')

		expect(buildTableOutput(tableGeneratorMock, device))
			.toEqual('Main Info\nmain table\n\nDevice Integration Info (from virtual)\nvirtual device info')

		expect(tablePushMock).toHaveBeenCalledTimes(8)
		expect(buildTableFromItemMock).toHaveBeenCalledTimes(1)
		expect(buildTableFromItemMock).toHaveBeenCalledWith(virtual,
			['name', { prop: 'hubId', skipEmpty: true }, { prop: 'driverId', skipEmpty: true }])
	})
})

describe('buildComponentStatusTableOutput', () => {
	const tableGenerator = defaultTableGenerator({ groupRows: false })

	it('displays empty table when given no components', () => {
		expect(buildComponentStatusTableOutput(tableGenerator, {})).toBe(
			'──────────────────────────────\n' +
			' Capability  Attribute  Value \n' +
			'──────────────────────────────\n',
		)
	})

	it('displays populated table for complex component', () => {
		expect(buildComponentStatusTableOutput(tableGenerator, {
			button: {
				button: {
					value: 'held',
					timestamp: '2022-08-02T20:18:49.232Z',
				},
				numberOfButtons: {
					value: 3,
					timestamp: '2022-08-02T20:18:49.232Z',
				},
				supportedButtonValues: {
					value: [
						'up_5x',
					],
					timestamp: '2022-08-02T20:18:49.232Z',
				},
			},
			temperatureMeasurement: {
				temperatureRange: {
					value: null,
				},
				temperature: {
					value: 152.99142132163604,
					unit: 'F',
					timestamp: '2022-08-02T20:18:49.232Z',
				},
			},
		})).toBe(
			'─────────────────────────────────────────────────────────────────────\n' +
			' Capability              Attribute              Value                \n' +
			'─────────────────────────────────────────────────────────────────────\n' +
			' button                  button                 "held"               \n' +
			' button                  numberOfButtons        3                    \n' +
			' button                  supportedButtonValues  ["up_5x"]            \n' +
			' temperatureMeasurement  temperatureRange                            \n' +
			' temperatureMeasurement  temperature            152.99142132163604 F \n' +
			'─────────────────────────────────────────────────────────────────────\n',
		)
	})
})

describe('buildStatusTableOutput', () => {
	const tableGenerator = defaultTableGenerator({ groupRows: false })

	it('returns empty string for no components', () => {
		expect(buildStatusTableOutput(tableGenerator, {})).toEqual('')
		expect(buildStatusTableOutput(tableGenerator, { components: {} })).toEqual('')
	})

	it('handles a single component', () => {
		const deviceStatus: DeviceStatus = {
			components: {
				main: {
					switch: {
						switch: {
							value: 'off',
						},
					},
				},
			},
		}

		expect(buildStatusTableOutput(tableGenerator, deviceStatus)).toEqual(
			'main component\n' +
			'──────────────────────────────\n' +
			' Capability  Attribute  Value \n' +
			'──────────────────────────────\n' +
			' switch      switch     "off" \n' +
			'──────────────────────────────\n')
	})

	it('handles a multiple components', () => {
		const deviceStatus: DeviceStatus = {
			components: {
				main: {
					switch: {
						switch: {
							value: 'off',
						},
					},
				},
				light: {
					switchLevel: {
						level: {
							value: 80,
						},
					},
				},
			},
		}

		expect(buildStatusTableOutput(tableGenerator, deviceStatus)).toEqual(
			'main component\n' +
			'──────────────────────────────\n' +
			' Capability  Attribute  Value \n' +
			'──────────────────────────────\n' +
			' switch      switch     "off" \n' +
			'──────────────────────────────\n' +
			'\n\n' +
			'light component\n' +
			'───────────────────────────────\n' +
			' Capability   Attribute  Value \n' +
			'───────────────────────────────\n' +
			' switchLevel  level      80    \n' +
			'───────────────────────────────\n')
	})
})
