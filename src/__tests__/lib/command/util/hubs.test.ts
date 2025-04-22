import { jest } from '@jest/globals'

import {
	type LocationsEndpoint,
	type Device,
	type DevicesEndpoint,
	type Location,
	DeviceIntegrationType,
} from '@smartthings/core-sdk'

import type { APICommand } from '../../../../lib/command/api-command.js'
import { loggerMock, warnMock } from '../../../test-lib/logger-mock.js'


const { listOwnedHubs } = await import('../../../../lib/command/util/hubs.js')


describe('listOwnedHubs', () => {
	const ownedHub = { deviceId: 'owned-hub-id', locationId: 'owned-location-id' } as Device
	const sharedHub = { deviceId: 'shared-hub-id', locationId: 'shared-location-id' } as Device
	const hubs = [ownedHub, sharedHub]
	const apiDevicesListMock = jest.fn<typeof DevicesEndpoint.prototype.list>().mockResolvedValue(hubs)

	const ownedLocation = { locationId: 'owned-location-id', allowed: ['d:locations'] } as Location
	const sharedLocation = { locationId: 'shared-location-id', allowed: ['w:locations'] } as Location
	const apiLocationsGetMock = jest.fn<typeof LocationsEndpoint.prototype.get>().mockImplementation(
		async (locationId) => locationId === 'owned-location-id' ? ownedLocation : sharedLocation,
	)

	const command = {
		client: {
			devices: {
				list: apiDevicesListMock,
			},
			locations: {
				get: apiLocationsGetMock,
			},
		},
		logger: loggerMock,
	} as unknown as APICommand


	it('filters out hubs from shared locations', async () => {
		expect(await listOwnedHubs(command)).toStrictEqual([ownedHub])

		expect(apiDevicesListMock).toHaveBeenCalledExactlyOnceWith({ type: DeviceIntegrationType.HUB })
		expect(warnMock).toHaveBeenCalledExactlyOnceWith('filtering out location', sharedLocation)
		expect(apiLocationsGetMock).toHaveBeenCalledTimes(2)
		expect(apiLocationsGetMock).toHaveBeenCalledWith('owned-location-id', { allowed: true })
		expect(apiLocationsGetMock).toHaveBeenCalledWith('shared-location-id', { allowed: true })
	})

	it('logs warning when hub record found without location id', async () => {
		const badHub = { deviceId: 'bad-hub-id' } as Device
		apiDevicesListMock.mockResolvedValueOnce([badHub, ownedHub])

		expect(await listOwnedHubs(command)).toStrictEqual([ownedHub])

		expect(warnMock).toHaveBeenCalledExactlyOnceWith('hub record found without locationId', badHub)
		expect(apiLocationsGetMock).toHaveBeenCalledExactlyOnceWith('owned-location-id', { allowed: true })
	})
})
