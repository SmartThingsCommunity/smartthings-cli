import { Device, DeviceStatus, HubDeviceDetails, MatterDeviceDetails } from '@smartthings/core-sdk'

import { Table, TableFieldDefinition, TableGenerator, ValueTableFieldDefinition } from '@smartthings/cli-lib'

import {
	buildEmbeddedStatusTableOutput,
	buildStatusTableOutput,
	buildTableOutput,
	prettyPrintAttribute,
} from '../../../lib/commands/devices-util.js'


const tablePushMock: jest.Mock<number, [(string | undefined)[]]> = jest.fn()
const tableToStringMock = jest.fn()
const tableMock = {
	push: tablePushMock,
	toString: tableToStringMock,
} as unknown as Table
const newOutputTableMock = jest.fn().mockReturnValue(tableMock)
const buildTableFromItemMock = jest.fn()
const buildTableFromListMock = jest.fn()

const tableGeneratorMock: TableGenerator = {
	newOutputTable: newOutputTableMock,
	buildTableFromItem: buildTableFromItemMock,
	buildTableFromList: buildTableFromListMock,
}

describe('prettyPrintAttribute', () => {
	it ('handles integer value', () => {
		expect(prettyPrintAttribute(100)).toEqual('100')
	})

	it ('handles decimal value', () => {
		expect(prettyPrintAttribute(21.5)).toEqual('21.5')
	})

	it ('handles string value', () => {
		expect(prettyPrintAttribute('active')).toEqual('"active"')
	})

	it ('handles object value', () => {
		expect(prettyPrintAttribute({ x: 1, y: 2 })).toEqual('{"x":1,"y":2}')
	})

	it ('handles large object value', () => {
		const value = {
			name: 'Entity name',
			id: 'entity-id',
			description: 'This is a test entity. It serves no other purpose other than to be used in this test.',
			version: 1,
			precision: 120.375,
		}
		const expectedResult = JSON.stringify(value, null, 2)
		expect(prettyPrintAttribute(value)).toEqual(expectedResult)
	})
})

describe('buildStatusTableOutput', () => {

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

		tableToStringMock.mockReturnValueOnce('main component status')

		expect(buildStatusTableOutput(tableGeneratorMock, deviceStatus))
			.toEqual('main component status\n')

		expect(tablePushMock).toHaveBeenCalledTimes(1)
		expect(tablePushMock).toHaveBeenCalledWith(['switch', 'switch', '"off"'])
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

		tableToStringMock.mockReturnValueOnce('main component status')
		tableToStringMock.mockReturnValueOnce('light component status')

		expect(buildStatusTableOutput(tableGeneratorMock, deviceStatus))
			.toEqual('\nmain component\nmain component status\n\nlight component\nlight component status\n')

		expect(tablePushMock).toHaveBeenCalledTimes(2)
		expect(tablePushMock).toHaveBeenNthCalledWith(1, ['switch', 'switch', '"off"'])
		expect(tablePushMock).toHaveBeenNthCalledWith(2, ['switchLevel', 'level', '80'])
	})
})

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

	it('handles a multiple components', () => {
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

	it('includes all main fields', () => {
		const device = {
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
		tableToStringMock.mockReturnValueOnce('main table')

		expect(buildTableOutput(tableGeneratorMock, device))
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
			.toEqual('Main Info\nmain table\n\nDevice Integration Info (from ble)\nNo Device Integration Info for BLE devices')

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
		`('hardware version function maps label "$hardwareLabel" and version "$hardware" to "$expected"', ({ hardwareLabel, hardware, expected }) => {
			tableToStringMock.mockReturnValueOnce('main table')
			buildTableFromItemMock.mockReturnValue('matter info')

			expect(buildTableOutput(tableGeneratorMock, device))
				.toEqual('Main Info\nmain table\n\nDevice Integration Info (from matter)\nmatter info')

			const tableDefinitions = buildTableFromItemMock.mock.calls[0][1] as TableFieldDefinition<MatterDeviceDetails>[]
			const hardwareVersionFunc = (tableDefinitions[8] as ValueTableFieldDefinition<MatterDeviceDetails>).value

			const matterDeviceDetails = { version: { hardwareLabel, hardware } } as MatterDeviceDetails
			expect(hardwareVersionFunc(matterDeviceDetails)).toBe(expected)
		})

		test('hardware version function maps undefined version to "n/a"', () => {
			tableToStringMock.mockReturnValueOnce('main table')
			buildTableFromItemMock.mockReturnValue('matter info')

			expect(buildTableOutput(tableGeneratorMock, device))
				.toEqual('Main Info\nmain table\n\nDevice Integration Info (from matter)\nmatter info')

			const tableDefinitions = buildTableFromItemMock.mock.calls[0][1] as TableFieldDefinition<MatterDeviceDetails>[]
			const hardwareVersionFunc = (tableDefinitions[8] as ValueTableFieldDefinition<MatterDeviceDetails>).value

			const matterDeviceDetails = {} as MatterDeviceDetails
			expect(hardwareVersionFunc(matterDeviceDetails)).toBe('n/a')
		})

		test.each`
			softwareLabel | software     | expected
			${undefined}  | ${undefined} | ${'n/a (n/a)'}
			${'1.0.0'}    | ${undefined} | ${'1.0.0 (n/a)'}
			${undefined}  | ${72}        | ${'n/a (72)'}
			${'1.0.0'}    | ${72}        | ${'1.0.0 (72)'}
		`('software version function maps label "$softwareLabel" and version "$software" to "$expected"', ({ softwareLabel, software, expected }) => {
			tableToStringMock.mockReturnValueOnce('main table')
			buildTableFromItemMock.mockReturnValue('matter info')

			expect(buildTableOutput(tableGeneratorMock, device))
				.toEqual('Main Info\nmain table\n\nDevice Integration Info (from matter)\nmatter info')

			const tableDefinitions = buildTableFromItemMock.mock.calls[0][1] as TableFieldDefinition<MatterDeviceDetails>[]
			const softwareVersionFunc = (tableDefinitions[9] as ValueTableFieldDefinition<MatterDeviceDetails>).value

			const matterDeviceDetails = { version: { softwareLabel, software } } as MatterDeviceDetails
			expect(softwareVersionFunc(matterDeviceDetails)).toBe(expected)
		})

		test('software version function maps undefined version to "n/a"', () => {
			tableToStringMock.mockReturnValueOnce('main table')
			buildTableFromItemMock.mockReturnValue('matter info')

			expect(buildTableOutput(tableGeneratorMock, device))
				.toEqual('Main Info\nmain table\n\nDevice Integration Info (from matter)\nmatter info')

			const tableDefinitions = buildTableFromItemMock.mock.calls[0][1] as TableFieldDefinition<MatterDeviceDetails>[]
			const softwareVersionFunc = (tableDefinitions[9] as ValueTableFieldDefinition<MatterDeviceDetails>).value

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

			const tableDefinitions = buildTableFromItemMock.mock.calls[0][1] as TableFieldDefinition<MatterDeviceDetails>[]
			const endpointsFunc = (tableDefinitions[10] as ValueTableFieldDefinition<MatterDeviceDetails>).value

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

			const tableDefinitions = buildTableFromItemMock.mock.calls[0][1] as TableFieldDefinition<HubDeviceDetails>[]
			const hubDriversFunc = (tableDefinitions[33] as ValueTableFieldDefinition<HubDeviceDetails>).value

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

	it.todo('adds multiple components')
	it.todo('joins multiple component capabilities with newlines')
	it.todo('joins multiple children with newlines')
})
