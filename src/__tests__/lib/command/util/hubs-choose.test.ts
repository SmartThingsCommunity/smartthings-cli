import { jest } from '@jest/globals'

import { DeviceIntegrationType, DevicesEndpoint, type Device } from '@smartthings/core-sdk'

import type { APICommand } from '../../../../lib/command/api-command.js'
import type { listOwnedHubs } from '../../../../lib/command/util/hubs.js'
import type { createChooseFn, ChooseFunction } from '../../../../lib/command/util/util-util.js'


const createChooseFnMock = jest.fn<typeof createChooseFn<Device>>()
jest.unstable_mockModule('../../../../lib/command/util/util-util.js', () => ({
	createChooseFn: createChooseFnMock,
}))

const listOwnedHubsMock = jest.fn<typeof listOwnedHubs>()
jest.unstable_mockModule('../../../../lib/command/util/hubs.js', () => ({
	listOwnedHubs: listOwnedHubsMock,
}))


const { chooseHubFn } = await import('../../../../lib/command/util/hubs-choose.js')


describe('chooseHubFn', () => {
	const chooseHubMock = jest.fn<ChooseFunction<Device>>()
	createChooseFnMock.mockReturnValue(chooseHubMock)
	const hub = { deviceId: 'hub-device-id', label: 'hub-label' } as Device
	const hubs = [hub]
	const apiDevicesGetMock = jest.fn<typeof DevicesEndpoint.prototype.get>()
		.mockResolvedValue(hub)
	const apiDevicesListMock = jest.fn<typeof DevicesEndpoint.prototype.list>()
		.mockResolvedValue(hubs)
	listOwnedHubsMock.mockResolvedValue(hubs)
	const command = {
		client: {
			devices: {
				get: apiDevicesGetMock,
				list: apiDevicesListMock,
			},
		},
	} as unknown as APICommand

	it('limits to hub devices', async () => {
		const chooseHub = chooseHubFn()

		expect(chooseHub).toBe(chooseHubMock)

		expect(createChooseFnMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ itemName: 'hub' }),
			expect.any(Function),
			expect.any(Object),
		)

		const listItems = createChooseFnMock.mock.calls[0][1]

		expect(await listItems(command)).toBe(hubs)

		expect(apiDevicesListMock).toHaveBeenCalledExactlyOnceWith(
			{ type: DeviceIntegrationType.HUB, locationId: undefined },
		)
	})

	it('limits by specified location', async () => {
		const chooseHub = chooseHubFn({ locationId: 'location-filter-id' })

		expect(chooseHub).toBe(chooseHubMock)

		const listItems = createChooseFnMock.mock.calls[0][1]

		expect(await listItems(command)).toBe(hubs)

		expect(apiDevicesListMock).toHaveBeenCalledExactlyOnceWith(
			{ type: DeviceIntegrationType.HUB, locationId: 'location-filter-id' },
		)
	})

	it('includes only owned hubs when requested', async () => {
		const chooseHub = chooseHubFn({ includeOnlyOwnedHubs: true })

		expect(chooseHub).toBe(chooseHubMock)

		const listItems = createChooseFnMock.mock.calls[0][1]

		expect(await listItems(command)).toBe(hubs)

		expect(listOwnedHubsMock).toHaveBeenCalledExactlyOnceWith(command)

		expect(apiDevicesListMock).not.toHaveBeenCalled()
	})

	it('handles default config values', async () => {
		const chooseHub = chooseHubFn()

		expect(chooseHub).toBe(chooseHubMock)

		expect(createChooseFnMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ itemName: 'hub' }),
			expect.any(Function),
			{ defaultValue: expect.objectContaining({ configKey: 'defaultHub' }) },
		)

		const defaultValueConfig = createChooseFnMock.mock.calls[0][2]?.defaultValue
		const getItem = defaultValueConfig?.getItem

		expect(await getItem?.(command, 'hub-id')).toBe(hub)

		expect(apiDevicesGetMock).toHaveBeenCalledExactlyOnceWith('hub-id')

		const userMessage = defaultValueConfig?.userMessage

		expect(userMessage?.(hub)).toBe('using previously specified default hub labeled "hub-label" (hub-device-id)')
	})
})
