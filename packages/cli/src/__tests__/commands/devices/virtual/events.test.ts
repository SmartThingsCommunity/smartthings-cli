import {
	inputAndOutputItem,
	selectFromList,
} from '@smartthings/cli-lib'
import {
	CapabilitiesEndpoint,
	CapabilitySchemaPropertyName,
	DeviceEvent, DeviceIntegrationType,
	DevicesEndpoint,
	VirtualDevicesEndpoint,
} from '@smartthings/core-sdk'
import VirtualDeviceEventsCommand from '../../../../commands/devices/virtual/events'
import { CustomCapabilityStatus } from '@smartthings/core-sdk/dist/endpoint/capabilities'
import {
	chooseAttribute,
	chooseCapability,
	chooseComponent,
	chooseUnit,
	chooseValue,
} from '../../../../lib/commands/devices/devices-util'


jest.mock('../../../../lib/commands/devices/devices-util')

describe('VirtualDeviceEventsCommand', () => {
	const mockSelectFromList = jest.mocked(selectFromList)

	const mockInputAndOutputItem = jest.mocked(inputAndOutputItem)
	const createEventsSpy = jest.spyOn(VirtualDevicesEndpoint.prototype, 'createEvents').mockImplementation()
	const getCapabilitySpy = jest.spyOn(CapabilitiesEndpoint.prototype, 'get')
	const getDeviceSpy = jest.spyOn(DevicesEndpoint.prototype, 'get')

	it('calls correct endpoint', async () => {
		const createRequest: DeviceEvent[] = [
			{
				component: 'main',
				capability: 'switch',
				attribute: 'switch',
				value: 'on',
			},
		]

		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, createRequest)
		})

		mockSelectFromList.mockResolvedValueOnce('device-id')

		await expect(VirtualDeviceEventsCommand.run(['device-id'])).resolves.not.toThrow()

		expect(mockInputAndOutputItem).toBeCalledWith(
			expect.any(VirtualDeviceEventsCommand),
			expect.anything(),
			expect.any(Function),
			expect.anything(),
		)

		expect(mockSelectFromList).toHaveBeenCalledTimes(1)
		expect(mockSelectFromList).toBeCalledWith(
			expect.any(VirtualDeviceEventsCommand),
			expect.objectContaining({
				primaryKeyName: 'deviceId',
				sortKeyName: 'label',
			}),
			expect.objectContaining({
				preselectedId: 'device-id',
			}),
		)
		expect(createEventsSpy).toHaveBeenCalledTimes(1)
		expect(createEventsSpy).toBeCalledWith('device-id', createRequest)
	})

	it('string command line argument input', async () => {
		const expectedCreateRequest: DeviceEvent[] = [
			{
				component: 'main',
				capability: 'switch',
				attribute: 'switch',
				value: 'on',
			},
		]

		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction, inputProcessor) => {
			const data = await inputProcessor.read()
			await actionFunction(undefined, data)
		})

		mockSelectFromList.mockResolvedValueOnce('device-id')
		getCapabilitySpy.mockResolvedValueOnce({
			id: 'switch',
			version: 1,
			status: CustomCapabilityStatus.LIVE,
			name: 'Switch',
			attributes: {
				switch: {
					schema: {
						type: 'object',
						properties: {
							value: {
								title: 'IntegerPercent',
								type: 'string',
								enum: ['on', 'off'],
							},
						},
						additionalProperties: false,
						required: [
							CapabilitySchemaPropertyName.VALUE,
						],
					},
					enumCommands: [],
				},
			},
			commands: {},
		})

		await expect(VirtualDeviceEventsCommand.run(['device-id', 'switch:switch', 'on'])).resolves.not.toThrow()

		expect(createEventsSpy).toHaveBeenCalledTimes(1)
		expect(createEventsSpy).toBeCalledWith('device-id', expectedCreateRequest)
	})

	it('integer command line argument input', async () => {
		const expectedCreateRequest: DeviceEvent[] = [
			{
				component: 'main',
				capability: 'switchLevel',
				attribute: 'level',
				value: 80,
			},
		]

		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction, inputProcessor) => {
			const data = await inputProcessor.read()
			await actionFunction(undefined, data)
		})

		mockSelectFromList.mockResolvedValueOnce('device-id')
		getCapabilitySpy.mockResolvedValueOnce({
			id: 'switchLevel',
			version: 1,
			status: CustomCapabilityStatus.LIVE,
			name: 'Switch Level',
			attributes: {
				level: {
					schema: {
						title: 'IntegerPercent',
						type: 'object',
						properties: {
							value: {
								type: 'integer',
								minimum: 0,
								maximum: 100,
							},
							unit: {
								type: 'string',
								enum: [
									'%',
								],
								default: '%',
							},
						},
						additionalProperties: false,
						required: [
							CapabilitySchemaPropertyName.VALUE,
						],
					},
					enumCommands: [],
				},
			},
			commands: {},
		})

		await expect(VirtualDeviceEventsCommand.run(['device-id', 'switchLevel:level', '80'])).resolves.not.toThrow()

		expect(createEventsSpy).toHaveBeenCalledTimes(1)
		expect(createEventsSpy).toBeCalledWith('device-id', expectedCreateRequest)
	})

	it('float command line argument input', async () => {
		const expectedCreateRequest: DeviceEvent[] = [
			{
				component: 'main',
				capability: 'temperatureMeasurement',
				attribute: 'temperature',
				value: 72.5,
				unit: 'F',
			},
		]

		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction, inputProcessor) => {
			const data = await inputProcessor.read()
			await actionFunction(undefined, data)
		})

		mockSelectFromList.mockResolvedValueOnce('device-id')
		getCapabilitySpy.mockResolvedValueOnce({
			id: 'temperatureMeasurement',
			version: 1,
			status: CustomCapabilityStatus.LIVE,
			name: 'Temperature Measurement',
			attributes: {
				temperature: {
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
						required: [
							CapabilitySchemaPropertyName.VALUE,
							CapabilitySchemaPropertyName.UNIT,
						],
					},
					enumCommands: [],
				},
			},
			commands: {},
		})

		await expect(VirtualDeviceEventsCommand.run(['device-id', 'temperatureMeasurement:temperature', '72.5', 'F'])).resolves.not.toThrow()

		expect(createEventsSpy).toHaveBeenCalledTimes(1)
		expect(createEventsSpy).toBeCalledWith('device-id', expectedCreateRequest)
	})

	it('interactive input', async () => {
		const mockChooseComponent = jest.mocked(chooseComponent)
		const mockChooseCapability = jest.mocked(chooseCapability)
		const mockChooseAttribute = jest.mocked(chooseAttribute)
		const mockChooseValue = jest.mocked(chooseValue)
		const mockChooseUnit = jest.mocked(chooseUnit)
		const expectedCreateRequest: DeviceEvent[] = [
			{
				component: 'main',
				capability: 'temperatureMeasurement',
				attribute: 'temperature',
				value: 72.5,
				unit: 'F',
			},
		]

		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction, inputProcessor) => {
			const data = await inputProcessor.read()
			await actionFunction(undefined, data)
		})

		getDeviceSpy.mockResolvedValueOnce({
			deviceId: 'fba9a4e6-2ec6-4b81-9fe5-f8a0c555797a',
			name: 'Temperature Sensor',
			label: 'Temperature Sensor',
			manufacturerName: 'SmartThings',
			type: DeviceIntegrationType.VIRTUAL,
			presentationId: '21577123-03b3-4eb2-9bef-8251b87273fd',
			restrictionTier: 0,
			components: [
				{
					id: 'main',
					label: 'Main',
					capabilities: [
						{
							id: 'temperatureMeasurement',
							version: 1,
						},
					],
					categories: [],
				},
			],
		})

		getCapabilitySpy.mockResolvedValueOnce({
			id: 'temperatureMeasurement',
			version: 1,
			status: CustomCapabilityStatus.LIVE,
			name: 'Temperature Measurement',
			attributes: {
				temperature: {
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
						required: [
							CapabilitySchemaPropertyName.VALUE,
							CapabilitySchemaPropertyName.UNIT,
						],
					},
					enumCommands: [],
				},
			},
			commands: {},
		})

		mockSelectFromList.mockResolvedValueOnce('device-id')
		mockChooseComponent.mockResolvedValueOnce({
			id: 'main',
			capabilities: [
				{
					id: 'temperatureMeasurement',
					version: 1,
				},
			],
			categories: [],
		})
		mockChooseCapability.mockResolvedValueOnce({
			id: 'temperatureMeasurement',
			version: 1,
		})
		mockChooseAttribute.mockResolvedValueOnce({
			attributeName: 'temperature',
			attribute: {
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
					required: [
						CapabilitySchemaPropertyName.VALUE,
						CapabilitySchemaPropertyName.UNIT,
					],
				},
				enumCommands: [],
			},
		})
		mockChooseValue.mockResolvedValueOnce('72.5')
		mockChooseUnit.mockResolvedValueOnce('F')

		await expect(VirtualDeviceEventsCommand.run(['device-id'])).resolves.not.toThrow()

		expect(createEventsSpy).toHaveBeenCalledTimes(1)
		expect(createEventsSpy).toBeCalledWith('device-id', expectedCreateRequest)
	})
})
