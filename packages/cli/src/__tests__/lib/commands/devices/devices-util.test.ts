import inquirer from 'inquirer'

import Table from 'cli-table'

import {Device, DeviceIntegrationType} from '@smartthings/core-sdk'

import {APICommand, selectFromList, summarizedText, TableGenerator} from '@smartthings/cli-lib'

import {
	buildTableOutput,
	chooseAttribute,
	chooseCapability,
	chooseComponent,
	chooseUnit,
	chooseValue,
} from '../../../../lib/commands/devices/devices-util'


describe('devices-util', () => {
	describe('buildTableOutput', () => {
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
				components: [{ id: 'component-id', capabilities: [{ id: 'capability-id' }] }],
				childDevices: [{ id: 'child-id' }],
				profile: { id: 'device-profile-id' },
			} as unknown as Device
			tableToStringMock.mockReturnValueOnce('main table')

			expect(buildTableOutput(tableGeneratorMock, device))
				.toEqual('Main Info\nmain table\n\n' + summarizedText)

			expect(tablePushMock).toHaveBeenCalledTimes(10)
			expect(tablePushMock).toHaveBeenCalledWith(['Name', 'device name'])
			expect(tablePushMock).toHaveBeenCalledWith(['Type', 'device type'])
			expect(tablePushMock).toHaveBeenCalledWith(['Id', 'device-id'])
			expect(tablePushMock).toHaveBeenCalledWith(['Label', 'device label'])
			expect(tablePushMock).toHaveBeenCalledWith(['Manufacturer Code', 'device-manufacturer-code'])
			expect(tablePushMock).toHaveBeenCalledWith(['Location Id', 'location-id'])
			expect(tablePushMock).toHaveBeenCalledWith(['Room Id', 'room-id'])
			expect(tablePushMock).toHaveBeenCalledWith(['Child Devices', 'child-id'])
			expect(tablePushMock).toHaveBeenCalledWith(['component-id component', 'capability-id'])
			expect(tablePushMock).toHaveBeenCalledWith(['Profile Id', 'device-profile-id'])
			expect(tableToStringMock).toHaveBeenCalledTimes(1)
		})

		it('handles old style profile id', () => {
			const device = {
				profileId: 'device-profile-id',
			} as unknown as Device
			tableToStringMock.mockReturnValueOnce('main table')

			expect(buildTableOutput(tableGeneratorMock, device))
				.toEqual('Main Info\nmain table\n\n' + summarizedText)

			expect(tablePushMock).toHaveBeenCalledTimes(9)
			expect(tablePushMock).toHaveBeenCalledWith(['Profile Id', 'device-profile-id'])
		})

		it('defaults optional fields to empty strings', () => {
			const device = {} as unknown as Device
			tableToStringMock.mockReturnValueOnce('main table')

			expect(buildTableOutput(tableGeneratorMock, device))
				.toEqual('Main Info\nmain table\n\n' + summarizedText)

			expect(tablePushMock).toHaveBeenCalledTimes(9)
			expect(tablePushMock).toHaveBeenCalledWith(['Manufacturer Code', ''])
			expect(tablePushMock).toHaveBeenCalledWith(['Location Id', ''])
			expect(tablePushMock).toHaveBeenCalledWith(['Room Id', ''])
			expect(tablePushMock).toHaveBeenCalledWith(['Child Devices', ''])
			expect(tablePushMock).toHaveBeenCalledWith(['Profile Id', ''])
		})

		it('includes app info', () => {
			const app = { installedAppId: 'installed-app-id' }
			const device = { app } as unknown as Device
			tableToStringMock.mockReturnValueOnce('main table')
			buildTableFromItemMock.mockReturnValue('app info')

			expect(buildTableOutput(tableGeneratorMock, device))
				.toEqual('Main Info\nmain table\n\nDevice Integration Info (from app)\napp info\n\n' + summarizedText)

			expect(tablePushMock).toHaveBeenCalledTimes(9)
			expect(buildTableFromItemMock).toHaveBeenCalledTimes(1)
			expect(buildTableFromItemMock).toHaveBeenCalledWith(app,
				['installedAppId', 'externalId', { prop: 'profile.id', label: 'Profile Id' }])
		})

		it('includes ble info', () => {
			const ble = { thisIs: 'a ble device' }
			const device = { ble } as unknown as Device
			tableToStringMock.mockReturnValueOnce('main table')

			expect(buildTableOutput(tableGeneratorMock, device))
				.toEqual('Main Info\nmain table\n\nDevice Integration Info (from ble)\nNo Device Integration Info for BLE devices\n\n' + summarizedText)

			expect(tablePushMock).toHaveBeenCalledTimes(9)
			expect(buildTableFromItemMock).toHaveBeenCalledTimes(0)
		})

		it('includes bleD2D info', () => {
			const bleD2D = { identifier: 'bleD2D-device' }
			const device = { bleD2D } as unknown as Device
			tableToStringMock.mockReturnValueOnce('main table')
			buildTableFromItemMock.mockReturnValue('bleD2D info')

			expect(buildTableOutput(tableGeneratorMock, device))
				.toEqual('Main Info\nmain table\n\nDevice Integration Info (from bleD2D)\nbleD2D info\n\n' + summarizedText)

			expect(tablePushMock).toHaveBeenCalledTimes(9)
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

			expect(tablePushMock).toHaveBeenCalledTimes(9)
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

			expect(tablePushMock).toHaveBeenCalledTimes(9)
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

			expect(tablePushMock).toHaveBeenCalledTimes(9)
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

			expect(tablePushMock).toHaveBeenCalledTimes(9)
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

			expect(tablePushMock).toHaveBeenCalledTimes(9)
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

			expect(tablePushMock).toHaveBeenCalledTimes(9)
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

			expect(tablePushMock).toHaveBeenCalledTimes(9)
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

			expect(tablePushMock).toHaveBeenCalledTimes(9)
			expect(buildTableFromItemMock).toHaveBeenCalledTimes(1)
			expect(buildTableFromItemMock).toHaveBeenCalledWith(viper,
				['uniqueIdentifier', 'manufacturerName', 'modelName', 'swVersion', 'hwVersion'])
		})

		it.todo('adds multiple components')
		it.todo('joins multiple component capabilities with newlines')
		it.todo('joins multiple children with newlines')
	})

	describe('chooseComponent', () => {
		const command = { } as unknown as APICommand<typeof APICommand.flags>
		const selectFromListMock = jest.mocked(selectFromList)

		it('returns single component when only one', async () => {
			selectFromListMock.mockImplementation(async () => 'main')
			const device: Device = {
				deviceId: 'device-id',
				presentationId: 'presentation-id',
				manufacturerName: 'manufacturer-name',
				restrictionTier: 1,
				type: DeviceIntegrationType.VIRTUAL,
				components: [
					{
						id: 'main',
						capabilities: [],
						categories: [],
					},
				],
			}

			const component = await chooseComponent(command, device)
			expect(selectFromListMock).toHaveBeenCalledTimes(1)
			expect(selectFromListMock).toHaveBeenCalledWith(command,
				expect.objectContaining({ primaryKeyName: 'id', sortKeyName: 'id' }),
				expect.objectContaining({ preselectedId: 'main' }))
			expect(component).toBeDefined()
			expect(component.id).toBe('main')
		})

		it('prompts prompts when multiple components', async () => {
			selectFromListMock.mockImplementation(async () => 'channel1')

			const device: Device = {
				deviceId: 'device-id',
				presentationId: 'presentation-id',
				manufacturerName: 'manufacturer-name',
				restrictionTier: 1,
				type: DeviceIntegrationType.VIRTUAL,
				components: [
					{
						id: 'main',
						capabilities: [],
						categories: [],
					},
					{
						id: 'channel1',
						capabilities: [],
						categories: [],
					},
					{
						id: 'channel2',
						capabilities: [],
						categories: [],
					},
				],
			}

			const component = await chooseComponent(command, device)
			expect(selectFromListMock).toHaveBeenCalledTimes(1)

			expect(selectFromListMock).toHaveBeenCalledWith(command,
				expect.objectContaining({ primaryKeyName: 'id', sortKeyName: 'id' }),
				expect.not.objectContaining({ preselectedId: 'main' }))
			expect(component).toBeDefined()
			expect(component.id).toBe('channel1')
		})
	})

	describe('chooseCapability', () => {
		const command = { } as unknown as APICommand<typeof APICommand.flags>
		const selectFromListMock = jest.mocked(selectFromList)

		it('returns single capability when only one', async () => {
			selectFromListMock.mockImplementation(async () => 'switch')
			const component = {
				id: 'main',
				capabilities: [
					{
						id: 'switch',
						version: 1,
					},
				],
				categories: [],
			}

			const capability = await chooseCapability(command, component)
			expect(selectFromListMock).toHaveBeenCalledTimes(1)
			expect(selectFromListMock).toHaveBeenCalledWith(command,
				expect.objectContaining({ primaryKeyName: 'id', sortKeyName: 'id' }),
				expect.objectContaining({ preselectedId: 'switch' }))
			expect(capability).toBeDefined()
			expect(capability.id).toBe('switch')
		})

		it('prompts when multiple capabilities', async () => {
			selectFromListMock.mockImplementation(async () => 'switchLevel')

			const component = {
				id: 'main',
				capabilities: [
					{
						id: 'switch',
						version: 1,
					},
					{
						id: 'switchLevel',
						version: 1,
					},
				],
				categories: [],
			}

			const capability = await chooseCapability(command, component)
			expect(selectFromListMock).toHaveBeenCalledTimes(1)
			expect(selectFromListMock).toHaveBeenCalledWith(command,
				expect.objectContaining({ primaryKeyName: 'id', sortKeyName: 'id' }),
				expect.not.objectContaining({ preselectedId: expect.anything() }))
			expect(capability).toBeDefined()
			expect(capability.id).toBe('switchLevel')
		})
	})

	describe('chooseAttribute', () => {
		const selectFromListMock = jest.mocked(selectFromList)
		const getCapabilityMock = jest.fn()
		const client = { capabilities: { get: getCapabilityMock } }
		const command = { client } as unknown as APICommand<typeof APICommand.flags>

		it('returns single attribute when only one', async () => {
			selectFromListMock.mockImplementation(async () => 'switch')
			const capabilityReference = {
				id: 'switch',
				version: 1,
			}
			const capabilityDefinition = {
				id: 'switch',
				version: 1,
				attributes: {
					switch: {
						schema: {
							type: 'object',
							properties: {
								value: {
									title: 'SwitchState',
									type: 'string',
									enum: [
										'on',
										'off',
									],
								},
							},
						},
					},
				},
			}
			getCapabilityMock.mockImplementation( async() => capabilityDefinition)

			const attribute = await chooseAttribute(command, capabilityReference)
			expect(selectFromListMock).toHaveBeenCalledTimes(1)
			expect(selectFromListMock).toHaveBeenCalledWith(command,
				expect.objectContaining({ primaryKeyName: 'attributeName', sortKeyName: 'attributeName' }),
				expect.objectContaining({ preselectedId: 'switch' }))
			expect(attribute).toBeDefined()
			expect(attribute.attributeName).toBe('switch')
		})
	})

	describe('chooseValue', () => {
		const selectFromListMock = jest.mocked(selectFromList)
		const command = { } as unknown as APICommand<typeof APICommand.flags>

		it('enum value', async () => {
			selectFromListMock.mockImplementation(async () => 'on')
			const attribute = {
				schema: {
					type: 'object',
					properties: {
						value: {
							title: 'SwitchState',
							type: 'string',
							enum: [
								'on',
								'off',
							],
						},
					},
					additionalProperties: false,
				},
			}

			const value = await chooseValue(command, attribute, 'switch')
			expect(selectFromListMock).toHaveBeenCalledTimes(1)
			expect(selectFromListMock).toHaveBeenCalledWith(command,
				expect.objectContaining({ primaryKeyName: 'value', sortKeyName: 'value' }),
				expect.toBeObject())
			expect(value).toBeDefined()
			expect(value).toBe('on')
		})

		it('numeric value', async () => {
			const promptSpy = jest.spyOn(inquirer, 'prompt')
			promptSpy.mockResolvedValue({ value: '72' })
			const attribute = {
				schema: {
					type: 'object',
					properties: {
						value: {
							title: 'TemperatureValue',
							type: 'number',
							minimum: -460,
							maximum: 10000,
						},
						unit: {
							type: 'string',
							enum: [
								'F',
								'C',
							],
						},
					},
					additionalProperties: false,
				},
			}

			const value = await chooseValue(command, attribute, 'temperature')
			expect(selectFromListMock).toHaveBeenCalledTimes(0)
			expect(promptSpy).toHaveBeenCalledTimes(1)
			expect(promptSpy).toHaveBeenCalledWith({
				type: 'input', name: 'value',
				message: 'Enter \'temperature\' attribute value:',
			})
			expect(value).toBeDefined()
			expect(value).toBe('72')
		})
	})

	describe('chooseUnit', () => {
		const selectFromListMock = jest.mocked(selectFromList)
		const command = { } as unknown as APICommand<typeof APICommand.flags>

		it('prompts when multiple units', async () => {
			selectFromListMock.mockImplementation(async () => 'F')
			const attribute = {
				schema: {
					type: 'object',
					properties: {
						value: {
							title: 'TemperatureValue',
							type: 'number',
							minimum: -460,
							maximum: 10000,
						},
						unit: {
							type: 'string',
							enum: [
								'F',
								'C',
							],
						},
					},
					additionalProperties: false,
				},
			}

			const unit = await chooseUnit(command, attribute)
			expect(selectFromListMock).toHaveBeenCalledTimes(1)
			expect(selectFromListMock).toHaveBeenCalledWith(command,
				expect.objectContaining({ primaryKeyName: 'unit', sortKeyName: 'unit' }),
				expect.not.objectContaining({ preselectedId: expect.anything() }))
			expect(unit).toBeDefined()
			expect(unit).toBe('F')
		})

		it('no prompt when only one unit', async () => {
			selectFromListMock.mockImplementation(async () => 'ppm')
			const attribute = {
				schema: {
					type: 'object',
					properties: {
						value: {
							type: 'number',
							minimum: 0,
							maximum: 1000000,
						},
						unit: {
							type: 'string',
							enum: ['ppm'],
						},
					},
					additionalProperties: false,
				},
			}

			const unit = await chooseUnit(command, attribute)
			expect(selectFromListMock).toHaveBeenCalledTimes(1)
			expect(selectFromListMock).toHaveBeenCalledWith(command,
				expect.objectContaining({ primaryKeyName: 'unit', sortKeyName: 'unit' }),
				expect.objectContaining({ preselectedId: 'ppm' }))
			expect(unit).toBeDefined()
			expect(unit).toBe('ppm')
		})
	})
})
