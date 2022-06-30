import {
	inputAndOutputItem,
	selectFromList,
} from '@smartthings/cli-lib'
import {
	Capability,
	CapabilitiesEndpoint,
	Component,
	Device,
	DeviceEvent,
	DevicesEndpoint,
	VirtualDevicesEndpoint,
} from '@smartthings/core-sdk'
import VirtualDeviceEventsCommand from '../../../commands/virtualdevices/events'
import {
	CapabilityAttributeItem,
	chooseAttribute,
	chooseCapability,
	chooseComponent,
	chooseUnit,
	chooseValue,
} from '../../../lib/commands/virtualdevices-util'


jest.mock('../../../lib/commands/virtualdevices-util')

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
		const capability = {
			attributes: {
				switch: {
					schema: {
						properties: {
							value: {
								type: 'string',
							},
						},
					},
				},
			},
		} as unknown
		getCapabilitySpy.mockResolvedValueOnce(capability as Capability)

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
		const capability = {
			attributes: {
				level: {
					schema: {
						properties: {
							value: {
								type: 'integer',
							},
						},
					},
				},
			},
		} as unknown
		getCapabilitySpy.mockResolvedValueOnce(capability as Capability)

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
		const capability = {
			attributes: {
				temperature: {
					schema: {
						properties: {
							value: {
								type: 'number',
							},
						},
					},
				},
			},
		} as unknown
		getCapabilitySpy.mockResolvedValueOnce(capability as Capability)

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

		getDeviceSpy.mockResolvedValueOnce({} as Device)
		getCapabilitySpy.mockResolvedValueOnce({} as Capability)
		mockSelectFromList.mockResolvedValueOnce('device-id')
		mockChooseComponent.mockResolvedValueOnce({ id: 'main' } as Component)
		mockChooseCapability.mockResolvedValueOnce({ id: 'temperatureMeasurement' })
		mockChooseAttribute.mockResolvedValueOnce(({
			attributeName: 'temperature',
			attribute: {
				schema: {
					properties: {
						value: {
							type: 'number',
						},
					},
				},
			},
		} as unknown) as CapabilityAttributeItem)
		mockChooseValue.mockResolvedValueOnce('72.5')
		mockChooseUnit.mockResolvedValueOnce('F')

		await expect(VirtualDeviceEventsCommand.run(['device-id'])).resolves.not.toThrow()

		expect(createEventsSpy).toHaveBeenCalledTimes(1)
		expect(createEventsSpy).toBeCalledWith('device-id', expectedCreateRequest)
	})
})
