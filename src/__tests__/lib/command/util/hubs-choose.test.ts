import { jest } from '@jest/globals'

import {
	DeviceIntegrationType,
	type DevicesEndpoint,
	type HubdevicesEndpoint,
	type InstalledDriver,
	type Device,
} from '@smartthings/core-sdk'

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
	const hub1 = { deviceId: 'hub-device-id-1', label: 'hub 1' } as Device
	const hub2 = { deviceId: 'hub-device-id-2', label: 'hub 2' } as Device
	const hubs = [hub1, hub2]
	const apiDevicesGetMock = jest.fn<typeof DevicesEndpoint.prototype.get>().mockResolvedValue(hub1)
	const apiDevicesListMock = jest.fn<typeof DevicesEndpoint.prototype.list>().mockResolvedValue(hubs)
	listOwnedHubsMock.mockResolvedValue(hubs)
	const apiHubDevicesGetInstalledMock = jest.fn<typeof HubdevicesEndpoint.prototype.getInstalled>()
	const command = {
		client: {
			devices: {
				get: apiDevicesGetMock,
				list: apiDevicesListMock,
			},
			hubdevices: {
				getInstalled: apiHubDevicesGetInstalledMock,
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

		expect(await getItem?.(command, 'hub-id')).toBe(hub1)

		expect(apiDevicesGetMock).toHaveBeenCalledExactlyOnceWith('hub-id')

		const userMessage = defaultValueConfig?.userMessage

		expect(userMessage?.(hub1)).toBe('using previously specified default hub labeled "hub 1" (hub-device-id-1)')
	})

	it('filters hubs with installed driver', async () => {
		expect(chooseHubFn({ withInstalledDriverId: 'installed-driver-id' })).toBe(chooseHubMock)

		expect(createChooseFnMock).toHaveBeenCalledWith(
			expect.objectContaining({ itemName: 'hub' }),
			expect.any(Function),
			expect.objectContaining({
				customNotFoundMessage: 'could not find hub with driver installed-driver-id installed' },
			),
		)

		apiHubDevicesGetInstalledMock.mockResolvedValueOnce({} as InstalledDriver)
		apiHubDevicesGetInstalledMock
			.mockImplementationOnce(() => { throw { message: 'it is not currently installed on that hub' } })
		const listItems = createChooseFnMock.mock.calls[0][1]

		expect(await listItems(command)).toStrictEqual([hub1])

		expect(apiHubDevicesGetInstalledMock).toHaveBeenCalledTimes(2)
		expect(apiHubDevicesGetInstalledMock).toHaveBeenCalledWith('hub-device-id-1', 'installed-driver-id')
		expect(apiHubDevicesGetInstalledMock).toHaveBeenCalledWith('hub-device-id-2', 'installed-driver-id')
	})

	it('rethrows unexpected errors from install check', async () => {
		expect(chooseHubFn({ withInstalledDriverId: 'installed-driver-id' })).toBe(chooseHubMock)

		apiHubDevicesGetInstalledMock.mockImplementationOnce(() => { throw Error('unexpected') })
		const listItems = createChooseFnMock.mock.calls[0][1]

		await expect(listItems(command)).rejects.toThrow('unexpected')

		expect(apiHubDevicesGetInstalledMock).toHaveBeenCalledExactlyOnceWith('hub-device-id-1', 'installed-driver-id')
	})
})
