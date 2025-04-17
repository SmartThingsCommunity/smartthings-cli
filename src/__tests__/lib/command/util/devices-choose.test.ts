import { jest } from '@jest/globals'

import type {
	Component,
	Device,
	DeviceListOptions,
	DevicesEndpoint,
} from '@smartthings/core-sdk'

import type { ValueTableFieldDefinition } from '../../../../lib/table-generator.js'
import type { fatalError } from '../../../../lib/util.js'
import type { APICommand } from '../../../../lib/command/api-command.js'
import type { stringTranslateToId } from '../../../../lib/command/command-util.js'
import type { TableCommonListOutputProducer } from '../../../../lib/command/format.js'
import type { BuildOutputFormatterFlags } from '../../../../lib/command/output-builder.js'
import type { createChooseFn, ChooseFunction } from '../../../../lib/command/util/util-util.js'


const stringTranslateToIdMock = jest.fn<typeof stringTranslateToId>()
jest.unstable_mockModule('../../../../lib/command/command-util.js', () => ({
	stringTranslateToId: stringTranslateToIdMock,
}))

const fatalErrorMock = jest.fn<typeof fatalError>().mockReturnValue('never return' as never)
jest.unstable_mockModule('../../../../lib/util.js', () => ({
	fatalError: fatalErrorMock,
}))

const createChooseFnMock = jest.fn<typeof createChooseFn<Device>>()
jest.unstable_mockModule('../../../../lib/command/util/util-util.js', () => ({
	createChooseFn: createChooseFnMock,
}))


const {
	chooseComponentFn,
	chooseDeviceFn,
} = await import('../../../../lib/command/util/devices-choose.js')

describe('chooseDeviceFn', () => {
	const chooseDeviceMock = jest.fn<ChooseFunction<Device>>()
	const deviceList = [{ deviceId: 'listed-device-id' } as Device]
	const apiDevicesListMock = jest.fn<typeof DevicesEndpoint.prototype.list>()
		.mockResolvedValue(deviceList)
	const command = {
		client: {
			devices: {
				list: apiDevicesListMock,
			},
		},
	} as unknown as APICommand

	it('uses correct endpoint to list devices', async () => {
		createChooseFnMock.mockReturnValueOnce(chooseDeviceMock)

		const chooseDevice = chooseDeviceFn()

		expect(chooseDevice).toBe(chooseDeviceMock)

		expect(createChooseFnMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ itemName: 'device' }),
			expect.any(Function),
		)

		const listItems = createChooseFnMock.mock.calls[0][1]

		expect(await listItems(command)).toBe(deviceList)

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

		expect(await listItems(command)).toBe(deviceList)

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

		const command = { client: {} } as unknown as APICommand
		expect(await listItems(command)).toBe(components)
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
		'display fatal error message for device with no components when not defaulting to main %#',
		device => {
			expect(chooseComponentFn(device, { defaultToMain: false })).toBe('never return')

			expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith('No components found')
		},
	)
})
