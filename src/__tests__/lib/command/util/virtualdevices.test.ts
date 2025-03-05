import { jest } from '@jest/globals'

import type inquirer from 'inquirer'

import { type DeviceProfile, DeviceProfileStatus } from '@smartthings/core-sdk'

import type { APICommand } from '../../../../lib/command/api-command.js'
import type { fileInputProcessor, InputProcessor } from '../../../../lib/command/input-processor.js'
import type { selectFromList } from '../../../../lib/command/select.js'
import type { chooseDeviceProfile } from '../../../../lib/command/util/deviceprofiles-choose.js'


const promptMock = jest.fn<typeof inquirer.prompt>()
jest.unstable_mockModule('inquirer', () => ({
	default: {
		prompt: promptMock,
	},
}))

const fileInputProcessorMock = jest.fn<typeof fileInputProcessor<DeviceProfile>>()
jest.unstable_mockModule('../../../../lib/command/input-processor.js', () => ({
	fileInputProcessor: fileInputProcessorMock,
}))

const selectFromListMock = jest.fn<typeof selectFromList>()
jest.unstable_mockModule('../../../../lib/command/select.js', () => ({
	selectFromList: selectFromListMock,
}))

const chooseDeviceProfileMock = jest.fn<typeof chooseDeviceProfile>()
jest.unstable_mockModule('../../../../lib/command/util/deviceprofiles-choose.js', () => ({
	chooseDeviceProfile: chooseDeviceProfileMock,
}))


const {
	chooseDeviceName,
	chooseDeviceProfileDefinition,
	chooseDevicePrototype,
	chooseAttribute,
	chooseCapability,
	chooseUnit,
	chooseValue,
} = await import('../../../../lib/command/util/virtualdevices.js')


const apiCapabilitiesGetMock = jest.fn()
const client = { capabilities: { get: apiCapabilitiesGetMock } }
const command = { client } as unknown as APICommand

describe('chooseDeviceName function', () => {
	test('choose with from prompt', async () => {
		promptMock.mockResolvedValue({ deviceName: 'Device Name' })

		const value = await chooseDeviceName()
		expect(promptMock).toHaveBeenCalledTimes(1)
		expect(promptMock).toHaveBeenCalledWith({
			type: 'input', name: 'deviceName',
			message: 'Device Name:',
		})
		expect(value).toBeDefined()
		expect(value).toBe('Device Name')
	})

	test('choose with default', async () => {
		promptMock.mockResolvedValue({ deviceName: 'Another Device Name' })

		const value = await chooseDeviceName('Device Name')
		expect(promptMock).toHaveBeenCalledTimes(0)
		expect(value).toBeDefined()
		expect(value).toBe('Device Name')
	})
})

describe('chooseDeviceProfileDefinition function', () => {
	test('choose profile id from prompt', async () => {
		chooseDeviceProfileMock.mockResolvedValueOnce('device-profile-id')

		const value = await chooseDeviceProfileDefinition(command)

		expect(chooseDeviceProfileMock).toHaveBeenCalledTimes(1)
		expect(chooseDeviceProfileMock).toHaveBeenCalledWith(command,
			undefined,
			expect.objectContaining({ allowIndex: true }))
		expect(value).toBeDefined()
		expect(value).toStrictEqual({ deviceProfileId: 'device-profile-id', deviceProfile: undefined })
	})

	test('choose profile id from default', async () => {
		const value = await chooseDeviceProfileDefinition(command, 'device-profile-id')

		expect(chooseDeviceProfileMock).toHaveBeenCalledTimes(0)
		expect(value).toBeDefined()
		expect(value).toStrictEqual({ deviceProfileId: 'device-profile-id', deviceProfile: undefined })
	})

	test('choose definition from file argument', async () => {
		const deviceProfile: DeviceProfile = {
			id: 'device-profile-id',
			name: 'name',
			components: [],
			status: DeviceProfileStatus.PUBLISHED,
		}

		const readMock = jest.fn<InputProcessor<DeviceProfile>['read']>().mockResolvedValueOnce(deviceProfile)
		fileInputProcessorMock.mockReturnValueOnce({
			ioFormat: 'json',
			hasInput: () => true,
			read: readMock,
		})

		const value = await chooseDeviceProfileDefinition(command, undefined, 'device-profile-file')

		expect(chooseDeviceProfileMock).toHaveBeenCalledTimes(0)
		expect(fileInputProcessorMock).toHaveBeenCalledExactlyOnceWith('device-profile-file')
		expect(readMock).toHaveBeenCalledExactlyOnceWith()
		expect(value).toBeDefined()
		expect(value).toStrictEqual({ deviceProfileId: undefined, deviceProfile })
	})
})

describe('chooseDevicePrototype function', () => {
	test('choose from default list prompt', async () => {
		selectFromListMock.mockResolvedValueOnce('VIRTUAL_SWITCH')

		const value = await chooseDevicePrototype(command)

		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(command,
			expect.objectContaining({
				primaryKeyName: 'id',
				listTableFieldDefinitions: ['name', 'id'],
			}),
			expect.not.objectContaining({ preselectedId: expect.anything() }))
		expect(value).toBeDefined()
		expect(value).toBe('VIRTUAL_SWITCH')
	})

	test('choose with command line value', async () => {
		selectFromListMock.mockResolvedValueOnce('VIRTUAL_SWITCH')

		const value = await chooseDevicePrototype(command, 'VIRTUAL_SWITCH')

		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(command,
			expect.objectContaining({
				primaryKeyName: 'id',
				listTableFieldDefinitions: ['name', 'id'],
			}),
			expect.objectContaining({ preselectedId: 'VIRTUAL_SWITCH' }))
		expect(value).toBeDefined()
		expect(value).toBe('VIRTUAL_SWITCH')
	})

	test('choose from extended list prompt', async () => {
		selectFromListMock.mockResolvedValueOnce('more')
		selectFromListMock.mockResolvedValueOnce('VIRTUAL_CONTACT_SENSOR')

		const value = await chooseDevicePrototype(command)

		expect(selectFromListMock).toHaveBeenCalledTimes(2)
		expect(selectFromListMock).toHaveBeenNthCalledWith(1, command,
			expect.objectContaining({
				primaryKeyName: 'id',
				listTableFieldDefinitions: ['name', 'id'],
			}),
			expect.toBeObject())
		expect(selectFromListMock).toHaveBeenNthCalledWith(2, command,
			expect.objectContaining({
				primaryKeyName: 'id',
				listTableFieldDefinitions: ['name', 'id'],
			}),
			expect.toBeObject())
		expect(value).toBeDefined()
		expect(value).toBe('VIRTUAL_CONTACT_SENSOR')
	})

	describe('chooseCapability', () => {
		it('returns single capability when only one', async () => {
			selectFromListMock.mockResolvedValueOnce('switch')
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
			selectFromListMock.mockResolvedValueOnce('switchLevel')

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
		it('returns single attribute when only one', async () => {
			selectFromListMock.mockResolvedValueOnce('switch')
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
			apiCapabilitiesGetMock.mockImplementation(async () => capabilityDefinition)

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
		test('enum value', async () => {
			selectFromListMock.mockResolvedValueOnce('on')
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

		test('numeric value', async () => {
			promptMock.mockResolvedValue({ value: '72' })
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
			expect(promptMock).toHaveBeenCalledTimes(1)
			expect(promptMock).toHaveBeenCalledWith({
				type: 'input', name: 'value',
				message: 'Enter \'temperature\' attribute value:',
			})
			expect(value).toBeDefined()
			expect(value).toBe('72')
		})
	})

	describe('chooseUnit', () => {
		it('prompts when multiple units', async () => {
			selectFromListMock.mockResolvedValueOnce('F')
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

		it('does not prompt when only one unit', async () => {
			selectFromListMock.mockResolvedValueOnce('ppm')
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
