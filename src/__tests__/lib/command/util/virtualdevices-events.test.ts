import { jest } from '@jest/globals'

import type {
	CapabilitiesEndpoint,
	Capability,
	CapabilityAttribute,
	Component,
	Device,
	DevicesEndpoint,
	SmartThingsClient,
} from '@smartthings/core-sdk'

import type { fatalError } from '../../../../lib/util.js'
import type { APICommand } from '../../../../lib/command/api-command.js'
import type { chooseComponentFn } from '../../../../lib/command/util/devices-choose.js'
import type { ChooseFunction } from '../../../../lib/command/util/util-util.js'
import type {
	chooseCapability,
	chooseUnit,
	chooseValue,
	chooseAttribute,
} from '../../../../lib/command/util/virtualdevices.js'



const fatalErrorMock = jest.fn<typeof fatalError>().mockReturnValue('never return' as never)
jest.unstable_mockModule('../../../../lib/util.js', () => ({
	fatalError: fatalErrorMock,
}))

const chooseComponentMock = jest.fn<ChooseFunction<Component>>()
const chooseComponentFnMock = jest.fn<typeof chooseComponentFn>().mockReturnValue(chooseComponentMock)
jest.unstable_mockModule('../../../../lib/command/util/devices-choose.js', () => ({
	chooseComponentFn: chooseComponentFnMock,
}))

const chooseAttributeMock = jest.fn<typeof chooseAttribute>()
const chooseCapabilityMock = jest.fn<typeof chooseCapability>()
const chooseUnitMock = jest.fn<typeof chooseUnit>()
const chooseValueMock = jest.fn<typeof chooseValue>()
jest.unstable_mockModule('../../../../lib/command/util/virtualdevices.js', () => ({
	chooseAttribute: chooseAttributeMock,
	chooseCapability: chooseCapabilityMock,
	chooseUnit: chooseUnitMock,
	chooseValue: chooseValueMock,
}))


const {
	convertAttributeValue,
	parseDeviceEvent,
	getInputFromUser,
} = await import('../../../../lib/command/util/virtualdevices-events.js')


test.each([
	{ type: 'integer', value: '5', expected: 5 },
	{ type: 'number', value: '5', expected: 5 },
	{ type: 'number', value: '13.5', expected: 13.5 },
	{ type: 'array', value: '[5, "string value"]', expected: [5, 'string value'] },
	{
		type: 'object',
		value: '{"key": "value", "otherKey": "other value"}',
		expected: { key: 'value', otherKey: 'other value' },
	},
	{ type: 'string', value: 'string value', expected: 'string value' },
])('convertAttributeValue', ({ type, value, expected }) => {
	const result = convertAttributeValue(type, value)
	expect(typeof result).toBe(typeof expected)
	expect(result).toStrictEqual(expected)
})

const apiCapabilitiesGetMock = jest.fn<typeof CapabilitiesEndpoint.prototype.get>()
const apiDevicesGetMock = jest.fn<typeof DevicesEndpoint.prototype.get>()
const client = {
	capabilities: {
		get: apiCapabilitiesGetMock,
	},
	devices: {
		get: apiDevicesGetMock,
	},
} as unknown as SmartThingsClient
const command = { client } as unknown as APICommand

const attribute = { schema: { properties: { value: { type: 'string' } } } } as CapabilityAttribute
const capability = {
	id: 'capability-id',
	attributes: { attributeName: attribute },
} as unknown as Capability

describe('parseDeviceEvent', () => {
	it.each([
		'not-enough-fields-here',
		'too:many:fields:here',
		'too:many:in:this:one:too:fields:here',
	])('displays error for too many or too few parts', async attributeName => {
		expect(await parseDeviceEvent(client, attributeName, '')).toBe('never return')

		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('Invalid attribute name'))
	})

	it('displays error when capability not found', async () => {
		apiCapabilitiesGetMock.mockResolvedValueOnce(undefined as unknown as Capability)

		expect(await parseDeviceEvent(client, 'capability-id:attributeName', 'attribute value')).toBe('never return')

		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith('Capability capability-id not valid.')
	})

	it('displays error when capability contains no attributes', async () => {
		apiCapabilitiesGetMock.mockResolvedValueOnce({ id: 'capability-id' } as Capability)

		expect(await parseDeviceEvent(client, 'capability-id:attributeName', 'attribute value')).toBe('never return')

		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith('Capability capability-id not valid.')
	})

	it('displays error when attribute not found', async () => {
		apiCapabilitiesGetMock.mockResolvedValueOnce({ id: 'capability-id', attributes: {} } as Capability)

		expect(await parseDeviceEvent(client, 'capability-id:attributeName', 'attribute value')).toBe('never return')

		expect(fatalErrorMock)
			.toHaveBeenCalledExactlyOnceWith('Attribute attributeName not found in capability capability-id.')
	})

	it('returns populated event for valid input', async () => {
		apiCapabilitiesGetMock.mockResolvedValueOnce(capability)

		expect(await parseDeviceEvent(
			client,
			'component1:capability-id:attributeName',
			'attribute value',
		)).toStrictEqual({
			component: 'component1',
			capability: 'capability-id',
			attribute: 'attributeName',
			value: 'attribute value',
			unit: undefined,
		})
	})

	it('returns populated event for valid input defaulting to "main" component', async () => {
		apiCapabilitiesGetMock.mockResolvedValueOnce(capability)

		expect(await parseDeviceEvent(
			client,
			'capability-id:attributeName',
			'attribute value',
			'thingamabobs',
		)).toStrictEqual({
			component: 'main',
			capability: 'capability-id',
			attribute: 'attributeName',
			value: 'attribute value',
			unit: 'thingamabobs',
		})
	})
})

describe('getInputFromUser', () => {
	const device = { deviceId: 'device-id', components: [{ id: 'main' }, { id: 'chosen-component-id' }] } as Device
	apiDevicesGetMock.mockResolvedValue(device)

	it('returns event without user intervention if fully specified', async () => {
		apiCapabilitiesGetMock.mockResolvedValueOnce(capability)

		expect(await getInputFromUser(
			command,
			{ name: 'capability-id:attributeName', value: 'attribute value', unit: 'thingamabobs' },
			'device-id',
		)).toStrictEqual([{
			component: 'main',
			capability: 'capability-id',
			attribute: 'attributeName',
			value: 'attribute value',
			unit: 'thingamabobs',
		}])

		expect(apiDevicesGetMock).not.toHaveBeenCalled()
		expect(chooseComponentFnMock).not.toHaveBeenCalled()
		expect(chooseCapabilityMock).not.toHaveBeenCalled()
		expect(chooseValueMock).not.toHaveBeenCalled()
		expect(chooseUnitMock).not.toHaveBeenCalled()
	})

	it('displays error when attribute name specified but not value', async () => {
		expect(await getInputFromUser(
			command,
			{ name: 'capability-id:attributeName' },
			'device-id',
		)).toBe('never return')

		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith('Attribute name specified without attribute value.')

		expect(apiDevicesGetMock).not.toHaveBeenCalled()
	})

	it('displays error when chosen component not found', async () => {
		chooseComponentMock.mockResolvedValueOnce('bad-component-id')

		expect(await getInputFromUser( command, {}, 'device-id')).toBe('never return')

		expect(fatalErrorMock)
			.toHaveBeenCalledExactlyOnceWith('Unexpectedly could not find component with id bad-component-id.')
	})

	it('returns event build from user interactions', async () => {
		apiCapabilitiesGetMock.mockResolvedValueOnce(capability)
		chooseComponentMock.mockResolvedValueOnce('chosen-component-id')
		const capabilityReference = { id: 'chosen-capability-id' }
		chooseCapabilityMock.mockResolvedValueOnce(capabilityReference)
		chooseAttributeMock.mockResolvedValueOnce({ attributeName: 'chosenAttName', attribute })
		chooseValueMock.mockResolvedValueOnce('chosen value')
		chooseUnitMock.mockResolvedValueOnce('chosenUnit')

		expect(await getInputFromUser(command, {}, 'device-id')).toStrictEqual([{
			component: 'chosen-component-id',
			capability: 'chosen-capability-id',
			attribute: 'chosenAttName',
			value: 'chosen value',
			unit: 'chosenUnit',
		}])
	})
})
