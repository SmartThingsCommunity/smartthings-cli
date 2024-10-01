import { jest } from '@jest/globals'

import type {
	AttributeState,
	Component,
	Device,
	DeviceListOptions,
	DevicesEndpoint,
	SmartThingsClient,
} from '@smartthings/core-sdk'
import { APICommand } from '../../../../lib/command/api-command.js'
import type { stringTranslateToId } from '../../../../lib/command/command-util.js'
import { TableCommonListOutputProducer } from '../../../../lib/command/format.js'
import { BuildOutputFormatterFlags } from '../../../../lib/command/output-builder.js'
import type { createChooseFn, ChooseFunction } from '../../../../lib/command/util/util-util.js'
import { ValueTableFieldDefinition } from '../../../../lib/table-generator.js'


const stringTranslateToIdMock = jest.fn<typeof stringTranslateToId>()
jest.unstable_mockModule('../../../../lib/command/command-util.js', () => ({
	stringTranslateToId: stringTranslateToIdMock,
}))

const createChooseFnMock = jest.fn<typeof createChooseFn<Device>>()
jest.unstable_mockModule('../../../../lib/command/util/util-util.js', () => ({
	createChooseFn: createChooseFnMock,
}))


const {
	chooseComponentFn,
	chooseDeviceFn,
	prettyPrintAttribute,
} = await import('../../../../lib/command/util/devices-util.js')

describe('chooseDeviceFn', () => {
	const chooseDeviceMock = jest.fn<ChooseFunction<Device>>()
	const deviceList = [{ deviceId: 'listed-device-id' } as Device]
	const apiDevicesListMock = jest.fn<typeof DevicesEndpoint.prototype.list>()
		.mockResolvedValue(deviceList)
	const client = {
		devices: {
			list: apiDevicesListMock,
		},
	} as unknown as SmartThingsClient

	it('uses correct endpoint to list devices', async () => {
		createChooseFnMock.mockReturnValueOnce(chooseDeviceMock)

		const chooseDevice = chooseDeviceFn()

		expect(chooseDevice).toBe(chooseDeviceMock)

		expect(createChooseFnMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ itemName: 'device' }),
			expect.any(Function),
		)

		const listItems = createChooseFnMock.mock.calls[0][1]

		expect(await listItems(client)).toBe(deviceList)

		expect(apiDevicesListMock).toHaveBeenCalledExactlyOnceWith()
	})

	it('passes deviceListOptions on to devices.list function', async () => {
		createChooseFnMock.mockReturnValueOnce(chooseDeviceMock)

		const deviceListOptions: DeviceListOptions = { capability: 'switch' }

		const chooseDevice = chooseDeviceFn(deviceListOptions)
		expect(chooseDevice).toBe(chooseDeviceMock)

		expect(createChooseFnMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ itemName: 'device' }),
			expect.any(Function),
		)

		const listItems = createChooseFnMock.mock.calls[0][1]

		expect(await listItems(client)).toBe(deviceList)

		expect(apiDevicesListMock).toHaveBeenCalledExactlyOnceWith(deviceListOptions)
	})
})

describe('chooseComponentFn', () => {
	const chooseComponentMock = jest.fn<ChooseFunction<Component>>()
	// `createChooseFnMock` has its generic typed to `Device` for chooseDeviceFn;
	// cast to use `Component` for this chooseComponentFn tests.
	const createChooseFnMockForComponent =
		createChooseFnMock as unknown as jest.Mock<typeof createChooseFn<Component>>
	const components = [{ id: 'main' }, { id: 'other-component' }]
	const device = { deviceId: 'device-id', components } as Device

	it('uses list of components from device for selection list', async () => {
		createChooseFnMockForComponent.mockReturnValueOnce(chooseComponentMock)
		const chooseComponent = chooseComponentFn(device)

		expect(chooseComponent).toBe(chooseComponentMock)

		expect(createChooseFnMockForComponent).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ itemName: 'component' }),
			expect.any(Function),
		)

		const listItems = createChooseFnMockForComponent.mock.calls[0][1]

		const client = {} as unknown as SmartThingsClient
		expect(await listItems(client)).toBe(components)
	})

	it('includes " (default)" for main component', async () => {
		createChooseFnMockForComponent.mockReturnValueOnce(chooseComponentMock)

		expect(chooseComponentFn(device)).toBe(chooseComponentMock)

		const fieldDefinition =
			(createChooseFnMockForComponent.mock.calls[0][0] as TableCommonListOutputProducer<Component>)
				.listTableFieldDefinitions[0] as ValueTableFieldDefinition<Component>

		const valueFunction = fieldDefinition.value

		expect(valueFunction({ id: 'main' } as Component)).toBe('main (default)')
		expect(valueFunction({ id: 'other' } as Component)).toBe('other')
	})

	const devicesWithNoComponents = [
		{},
		{ components: undefined },
		{ components: null },
		{ components: [] },
	] as Device[]
	it.each(devicesWithNoComponents)(
		'returns main for device with no components %#',
		async (device) => {
			const command = {} as APICommand<BuildOutputFormatterFlags>

			// This is the default
			const chooseComponent = chooseComponentFn(device)
			expect(createChooseFnMock).not.toHaveBeenCalled()
			expect(await chooseComponent(command)).toBe('main')

			// But it can also be explicitly requested
			const chooseComponent2 = chooseComponentFn(device, { defaultToMain: true })
			expect(createChooseFnMock).not.toHaveBeenCalled()
			expect(await chooseComponent2(command)).toBe('main')
		},
	)

	it.each(devicesWithNoComponents)(
		'throws for device with no components by not defaulting to main %#',
		device => {
			expect(() => chooseComponentFn(device, { defaultToMain: false }))
				.toThrow('No components found')
		},
	)
})

const complicatedAttribute: AttributeState = {
	value: {
		name: 'Entity name',
		id: 'entity-id',
		description: 'It is very big and huge and long so the serialized JSON is over 50 characters.',
		version: 1,
		precision: 120.375,
	},
}
const prettyPrintedComplicatedAttribute = JSON.stringify(complicatedAttribute.value, null, 2)

test.each([
	{ attribute: { value: null }, expected: '' },
	{ attribute: { value: undefined }, expected: '' },
	{ attribute: {}, expected: '' },
	{ attribute: { value: 100 }, expected: '100' },
	{ attribute: { value: 128, unit: 'yobibytes' }, expected: '128 yobibytes' },
	{ attribute: { value: 21.5 }, expected: '21.5' },
	{ attribute: { value: 'active' }, expected: '"active"' },
	{ attribute: { value: { x: 1, y: 2 } }, expected: '{"x":1,"y":2}' },
	{ attribute: complicatedAttribute, expected: prettyPrintedComplicatedAttribute },
])('prettyPrintAttribute returns $expected when given $attribute', ({ attribute, expected }) => {
	expect(prettyPrintAttribute(attribute)).toBe(expected)
})
