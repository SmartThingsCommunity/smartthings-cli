import { Device, DeviceStatus } from '@smartthings/core-sdk'

import { summarizedText, Table, TableGenerator } from '@smartthings/cli-lib'

import {
	buildEmbeddedStatusTableOutput,
	buildStatusTableOutput,
	buildTableOutput,
	prettyPrintAttribute,
} from '../../../lib/commands/devices-util'


describe('devices-util', () => {
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
				.toEqual('main component status\n')

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
				.toEqual('\nmain component\nmain component status\n\nlight component\nlight component status\n')

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
				.toEqual('Main Info\nmain table\n\n' + summarizedText)

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
				.toEqual('Main Info\nmain table\n\n' + summarizedText)

			expect(tablePushMock).toHaveBeenCalledTimes(8)
			expect(tablePushMock).toHaveBeenCalledWith(['Profile Id', 'device-profile-id'])
		})

		it('defaults optional fields to empty strings', () => {
			const device = {} as unknown as Device
			tableToStringMock.mockReturnValueOnce('main table')

			expect(buildTableOutput(tableGeneratorMock, device))
				.toEqual('Main Info\nmain table\n\n' + summarizedText)

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
				.toEqual('Main Info\nmain table\n\n' + summarizedText)

			expect(tablePushMock).toHaveBeenCalledTimes(10)
			expect(tablePushMock).toHaveBeenCalledWith(['Device Health', 'ONLINE'])
			expect(tablePushMock).toHaveBeenCalledWith(['Last Updated', '2022-07-28T14:50:42.899Z'])
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
				.toEqual('Main Info\nmain table\n\nDevice Status\ndevice status\n\n' + summarizedText)

			expect(tablePushMock).toHaveBeenCalledTimes(10)
			expect(tableToStringMock).toHaveBeenCalledTimes(2)
		})

		it('includes app info', () => {
			const app = { installedAppId: 'installed-app-id' }
			const device = { app } as unknown as Device
			tableToStringMock.mockReturnValueOnce('main table')
			buildTableFromItemMock.mockReturnValue('app info')

			expect(buildTableOutput(tableGeneratorMock, device))
				.toEqual('Main Info\nmain table\n\nDevice Integration Info (from app)\napp info\n\n' + summarizedText)

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
				.toEqual('Main Info\nmain table\n\nDevice Integration Info (from ble)\nNo Device Integration Info for BLE devices\n\n' + summarizedText)

			expect(tablePushMock).toHaveBeenCalledTimes(8)
			expect(buildTableFromItemMock).toHaveBeenCalledTimes(0)
		})

		it('includes bleD2D info', () => {
			const bleD2D = { identifier: 'bleD2D-device' }
			const device = { bleD2D } as unknown as Device
			tableToStringMock.mockReturnValueOnce('main table')
			buildTableFromItemMock.mockReturnValue('bleD2D info')

			expect(buildTableOutput(tableGeneratorMock, device))
				.toEqual('Main Info\nmain table\n\nDevice Integration Info (from bleD2D)\nbleD2D info\n\n' + summarizedText)

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
				.toEqual('Main Info\nmain table\n\nDevice Integration Info (from dth)\ndth info\n\n' + summarizedText)

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
				.toEqual('Main Info\nmain table\n\nDevice Integration Info (from lan)\nlan info\n\n' + summarizedText)

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
				.toEqual('Main Info\nmain table\n\nDevice Integration Info (from zigbee)\nzigbee info\n\n' + summarizedText)

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
				.toEqual('Main Info\nmain table\n\nDevice Integration Info (from zwave)\nzwave info\n\n' + summarizedText)

			expect(tablePushMock).toHaveBeenCalledTimes(8)
			expect(buildTableFromItemMock).toHaveBeenCalledTimes(1)
			expect(buildTableFromItemMock).toHaveBeenCalledWith(zwave,
				['networkId', 'driverId', 'executingLocally', 'hubId', 'networkSecurityLevel', 'provisioningState'])
		})

		it('includes ir info', () => {
			const ir = { irCode: 'ir-device-code' }
			const device = { ir } as unknown as Device
			tableToStringMock.mockReturnValueOnce('main table')
			buildTableFromItemMock.mockReturnValue('ir info')

			expect(buildTableOutput(tableGeneratorMock, device))
				.toEqual('Main Info\nmain table\n\nDevice Integration Info (from ir)\nir info\n\n' + summarizedText)

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
				.toEqual('Main Info\nmain table\n\nDevice Integration Info (from irOcf)\nir ocf info\n\n' + summarizedText)

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
				.toEqual('Main Info\nmain table\n\nDevice Integration Info (from ocf)\nocf info\n\n' + summarizedText)

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
				.toEqual('Main Info\nmain table\n\nDevice Integration Info (from viper)\nviper info\n\n' + summarizedText)

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
				.toEqual('Main Info\nmain table\n\nDevice Integration Info (from virtual)\nvirtual device info\n\n' + summarizedText)

			expect(tablePushMock).toHaveBeenCalledTimes(8)
			expect(buildTableFromItemMock).toHaveBeenCalledTimes(1)
			expect(buildTableFromItemMock).toHaveBeenCalledWith(virtual,
				['name', { prop: 'hubId', skipEmpty: true }, { prop: 'driverId', skipEmpty: true }])
		})

		it.todo('adds multiple components')
		it.todo('joins multiple component capabilities with newlines')
		it.todo('joins multiple children with newlines')
	})
})
