import { jest } from '@jest/globals'

import { DeviceIntegrationType, type Device, type DevicesEndpoint } from '@smartthings/core-sdk'

import { APICommand } from '../../../../lib/command/api-command.js'
import { createChooseFn, ChooseFunction } from '../../../../lib/command/util/util-util.js'


const createChooseFnMock = jest.fn<typeof createChooseFn<Device>>()
jest.unstable_mockModule('../../../../lib/command/util/util-util.js', () => ({
	createChooseFn: createChooseFnMock,
}))


const { chooseHubFn } = await import('../../../../lib/command/util/hubs-choose.js')


describe('chooseHubFn', () => {
	const chooseHubMock = jest.fn<ChooseFunction<Device>>()
	createChooseFnMock.mockReturnValue(chooseHubMock)
	const devices = [{ deviceId: 'hub-device-id' } as Device]
	const apiDevicesListMock = jest.fn<typeof DevicesEndpoint.prototype.list>()
		.mockResolvedValue(devices)
	const command = {
		client: {
			devices: {
				list: apiDevicesListMock,
			},
		},
	} as unknown as APICommand

	it('limits to hub devices', async () => {
		const chooseHub = chooseHubFn()

		expect(chooseHub).toBe(chooseHubMock)

		expect(createChooseFnMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({
				itemName: 'hub',
			}),
			expect.any(Function),
		)

		const listItems = createChooseFnMock.mock.calls[0][1]

		expect(await listItems(command)).toBe(devices)

		expect(apiDevicesListMock).toHaveBeenCalledExactlyOnceWith(
			{ type: DeviceIntegrationType.HUB, locationId: undefined },
		)
	})

	it('limits by specified location', async () => {
		const chooseHub = chooseHubFn({ locationId: 'location-filter-id' })

		expect(chooseHub).toBe(chooseHubMock)

		const listItems = createChooseFnMock.mock.calls[0][1]

		expect(await listItems(command)).toBe(devices)

		expect(apiDevicesListMock).toHaveBeenCalledExactlyOnceWith(
			{ type: DeviceIntegrationType.HUB, locationId: 'location-filter-id' },
		)
	})
})
