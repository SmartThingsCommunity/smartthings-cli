import { jest } from '@jest/globals'

import type { Location, LocationsEndpoint, Mode, ModesEndpoint, SmartThingsClient } from '@smartthings/core-sdk'

import type { fatalError } from '../../../../lib/util.js'


const fatalErrorMock = jest.fn<typeof fatalError>().mockReturnValue('never return' as never)
jest.unstable_mockModule('../../../../lib/util.js', () => ({
	fatalError: fatalErrorMock,
}))


const { getModesWithLocation } = await import('../../../../lib/command/util/modes.js')


describe('getModesWithLocation', () => {
	const apiModesListMock = jest.fn<typeof ModesEndpoint.prototype.list>()
	const apiLocationsGetMock = jest.fn<typeof LocationsEndpoint.prototype.get>()
	const apiLocationsListMock = jest.fn<typeof LocationsEndpoint.prototype.list>()
	const client = {
		modes: {
			list: apiModesListMock,
		},
		locations: {
			get: apiLocationsGetMock,
			list: apiLocationsListMock,
		},
	} as unknown as SmartThingsClient

	it('outputs error when no locations are found', async () => {
		apiLocationsListMock.mockResolvedValueOnce([])

		expect(await getModesWithLocation(client)).toBe('never return')

		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith(
			expect.stringContaining('Could not find any locations for your account.'),
		)
		expect(apiLocationsGetMock).not.toHaveBeenCalled()
	})

	it('outputs error when no locations are found', async () => {
		const forbiddenError = new Error('Request failed with status code 403')
		apiLocationsGetMock.mockRejectedValueOnce(forbiddenError)

		await expect(getModesWithLocation(client, 'location-id')).rejects.toThrow(forbiddenError)
	})

	const location1 = { locationId: 'location-id-1', name: 'location 1 name' } as Location
	const location2 = { locationId: 'location-id-2', name: 'location 2 name' } as Location
	const mode1: Mode = { name: 'Mode1', id: 'mode-id-1' }
	const mode2: Mode = { name: 'Mode2', id: 'mode-id-2' }
	const mode3: Mode = { name: 'Mode3', id: 'mode-id-3' }

	it('returns modes with location id and name added for a specified location', async () => {
		apiLocationsGetMock.mockResolvedValueOnce(location1)
		apiModesListMock.mockResolvedValueOnce([mode1])

		expect(await getModesWithLocation(client, 'location-id-1')).toStrictEqual([{
			...mode1,
			locationId: 'location-id-1',
			location: 'location 1 name',
		}])

		expect(apiLocationsListMock).not.toHaveBeenCalled()
	})

	it('returns modes with location id and name added for all locations', async () => {
		apiLocationsListMock.mockResolvedValueOnce([location1, location2])
		apiModesListMock.mockResolvedValueOnce([mode1])
		apiModesListMock.mockResolvedValueOnce([mode2, mode3])

		expect(await getModesWithLocation(client, undefined)).toStrictEqual([
			{ ...mode1, locationId: 'location-id-1', location: 'location 1 name' },
			{ ...mode2, locationId: 'location-id-2', location: 'location 2 name' },
			{ ...mode3, locationId: 'location-id-2', location: 'location 2 name' },
		])

		expect(apiLocationsGetMock).not.toHaveBeenCalled()
	})
})
