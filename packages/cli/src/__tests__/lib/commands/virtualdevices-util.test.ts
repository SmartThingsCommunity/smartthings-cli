import inquirer from 'inquirer'
import {
	APICommand,
	APIOrganizationCommand,
	FileInputProcessor,
	selectFromList,
} from '@smartthings/cli-lib'
import {
	chooseDeviceName,
	chooseDeviceProfileDefinition,
	chooseDevicePrototype,
	chooseAttribute,
	chooseCapability,
	chooseComponent,
	chooseUnit,
	chooseValue,
} from '../../../lib/commands/virtualdevices-util'
import { chooseDeviceProfile } from '../../../lib/commands/deviceprofiles-util'
import { Device, DeviceIntegrationType, DeviceProfile, DeviceProfileStatus } from '@smartthings/core-sdk'


jest.mock('../../../lib/commands/deviceprofiles-util')

describe('virtualdevices-util', () => {
	describe('chooseDeviceName function', () => {
		const command = {} as unknown as APICommand<typeof APICommand.flags>

		test('choose with from prompt', async () => {
			const promptSpy = jest.spyOn(inquirer, 'prompt')
			promptSpy.mockResolvedValue({ deviceName: 'Device Name' })

			const value = await chooseDeviceName(command)
			expect(promptSpy).toHaveBeenCalledTimes(1)
			expect(promptSpy).toHaveBeenCalledWith({
				type: 'input', name: 'deviceName',
				message: 'Device Name:',
			})
			expect(value).toBeDefined()
			expect(value).toBe('Device Name')
		})

		test('choose with default', async () => {
			const promptSpy = jest.spyOn(inquirer, 'prompt')
			promptSpy.mockResolvedValue({ deviceName: 'Another Device Name' })

			const value = await chooseDeviceName(command, 'Device Name')
			expect(promptSpy).toHaveBeenCalledTimes(0)
			expect(value).toBeDefined()
			expect(value).toBe('Device Name')
		})
	})

	describe('chooseDeviceProfileDefinition function', () => {
		const chooseDeviceProfileMock = jest.mocked(chooseDeviceProfile)
		const command = {} as unknown as APIOrganizationCommand<typeof APIOrganizationCommand.flags>

		test('choose profile ID from prompt', async () => {
			chooseDeviceProfileMock.mockResolvedValueOnce('device-profile-id')

			const value = await chooseDeviceProfileDefinition(command)

			expect(chooseDeviceProfileMock).toHaveBeenCalledTimes(1)
			expect(chooseDeviceProfileMock).toHaveBeenCalledWith(command,
				undefined,
				expect.objectContaining({ allowIndex: true }))
			expect(value).toBeDefined()
			expect(value).toEqual({ deviceProfileId: 'device-profile-id', deviceProfile: undefined })
		})

		test('choose profile ID from default', async () => {
			const value = await chooseDeviceProfileDefinition(command, 'device-profile-id')

			expect(chooseDeviceProfileMock).toHaveBeenCalledTimes(0)
			expect(value).toBeDefined()
			expect(value).toEqual({ deviceProfileId: 'device-profile-id', deviceProfile: undefined })
		})

		test('choose definition from file argument', async () => {
			const deviceProfile: DeviceProfile = {
				id: 'device-profile-id',
				name: 'name',
				components: [],
				status: DeviceProfileStatus.PUBLISHED,
			}

			const fileSpy = jest.spyOn(FileInputProcessor.prototype, 'read').mockResolvedValueOnce(deviceProfile)

			const value = await chooseDeviceProfileDefinition(command, undefined, 'device-profile-file')

			expect(chooseDeviceProfileMock).toHaveBeenCalledTimes(0)
			expect(fileSpy).toHaveBeenCalledTimes(1)
			expect(value).toBeDefined()
			expect(value).toEqual({ deviceProfileId: undefined, deviceProfile })
		})
	})

	describe('chooseDevicePrototype function', () => {
		const selectFromListMock = jest.mocked(selectFromList)
		const command = {} as unknown as APICommand<typeof APICommand.flags>

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

		describe('chooseComponent', () => {
			const command = {} as unknown as APICommand<typeof APICommand.flags>
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

			it('prompts when multiple components', async () => {
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
			const command = {} as unknown as APICommand<typeof APICommand.flags>
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
				getCapabilityMock.mockImplementation(async () => capabilityDefinition)

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
			const command = {} as unknown as APICommand<typeof APICommand.flags>

			test('enum value', async () => {
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

			test('numeric value', async () => {
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
			const command = {} as unknown as APICommand<typeof APICommand.flags>

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

			it('does not prompt when only one unit', async () => {
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
})
