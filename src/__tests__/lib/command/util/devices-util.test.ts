import { jest } from '@jest/globals'

import type { Device, DeviceListOptions, DevicesEndpoint, SmartThingsClient } from '@smartthings/core-sdk'
import type { stringTranslateToId } from '../../../../lib/command/command-util.js'
import type { createChooseFn, ChooseFunction } from '../../../../lib/command/util/util-util.js'


const stringTranslateToIdMock = jest.fn<typeof stringTranslateToId>()
jest.unstable_mockModule('../../../../lib/command/command-util.js', () => ({
	stringTranslateToId: stringTranslateToIdMock,
}))

const createChooseFnMock = jest.fn<typeof createChooseFn<Device>>()
jest.unstable_mockModule('../../../../lib/command/util/util-util.js', () => ({
	createChooseFn: createChooseFnMock,
}))


const { chooseDeviceFn } = await import('../../../../lib/command/util/devices-util.js')

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
