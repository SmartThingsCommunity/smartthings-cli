import { jest } from '@jest/globals'

import type {
	Location,
	LocationItem,
	LocationsEndpoint,
	Rule,
	RulesEndpoint,
	SmartThingsClient,
} from '@smartthings/core-sdk'

import type { WithNamedLocation } from '../../../../lib/api-helpers.js'
import type { fatalError } from '../../../../lib/util.js'


const fatalErrorMock = jest.fn<typeof fatalError>()
jest.unstable_mockModule('../../../../lib/util.js', () => ({
	fatalError: fatalErrorMock,
}))


const {
	getRulesByLocation,
	getRuleWithLocation,
} = await import('../../../../lib/command/util/rules-util.js')


const locationItem1: LocationItem = { locationId: 'location-id-1', name: 'Location 1' }
const locationItem2: LocationItem = { locationId: 'location-id-2', name: 'Location 2' }
const location1 = { ...locationItem1, countryCode: 'MEX' } as Location
const rule1 = { id: 'rule-id-1', name: 'rule-name-1' } as Rule
const rule2 = { id: 'rule-id-2', name: 'rule-name-2' } as Rule
const rule1WithLocation = { ...rule1, locationId: 'location-id-1', location: 'Location 1' } as Rule & WithNamedLocation
const rule2WithLocation = { ...rule2, locationId: 'location-id-2', location: 'Location 2' } as Rule & WithNamedLocation

const apiLocationsGetMock = jest.fn<typeof LocationsEndpoint.prototype.get>()
const apiLocationsListMock = jest.fn<typeof LocationsEndpoint.prototype.list>()
const locations = {
	get: apiLocationsGetMock,
	list: apiLocationsListMock,
}
const apiRulesGetMock = jest.fn<typeof RulesEndpoint.prototype.get>()
const apiRulesListMock = jest.fn<typeof RulesEndpoint.prototype.list>()
const rules = {
	get: apiRulesGetMock,
	list: apiRulesListMock,
}
const client = { locations, rules } as unknown as SmartThingsClient

describe('getRulesByLocation', () => {
	it('looks up location when one is specified', async () => {
		apiLocationsGetMock.mockResolvedValueOnce(location1)
		apiRulesListMock.mockResolvedValueOnce([rule1])

		expect(await getRulesByLocation(client, 'location-id-1')).toStrictEqual([rule1WithLocation])

		expect(apiLocationsGetMock).toHaveBeenCalledTimes(1)
		expect(apiLocationsGetMock).toHaveBeenCalledWith('location-id-1')
		expect(apiRulesListMock).toHaveBeenCalledTimes(1)
		expect(apiRulesListMock).toHaveBeenCalledWith('location-id-1')

		expect(apiLocationsListMock).not.toHaveBeenCalled()
		expect(apiRulesGetMock).not.toHaveBeenCalled()
	})

	it('combines rules from all locations when none is specified', async () => {
		apiLocationsListMock.mockResolvedValueOnce([locationItem1, locationItem2])
		apiRulesListMock.mockResolvedValueOnce([rule1])
		apiRulesListMock.mockResolvedValueOnce([rule2])

		expect(await getRulesByLocation(client)).toStrictEqual([rule1WithLocation, rule2WithLocation])

		expect(apiLocationsListMock).toHaveBeenCalledTimes(1)
		expect(apiRulesListMock).toHaveBeenCalledTimes(2)
		expect(apiRulesListMock).toHaveBeenCalledWith('location-id-1')
		expect(apiRulesListMock).toHaveBeenCalledWith('location-id-2')

		expect(apiLocationsGetMock).not.toHaveBeenCalled()
		expect(apiRulesGetMock).not.toHaveBeenCalled()
	})

	it('handles empty rule list for location', async () => {
		apiLocationsListMock.mockResolvedValueOnce([locationItem1, locationItem2])
		apiRulesListMock.mockResolvedValueOnce(undefined as unknown as Rule[])
		apiRulesListMock.mockResolvedValueOnce([])

		expect(await getRulesByLocation(client)).toStrictEqual([])

		expect(apiLocationsListMock).toHaveBeenCalledTimes(1)
		expect(apiRulesListMock).toHaveBeenCalledTimes(2)
		expect(apiRulesListMock).toHaveBeenCalledWith('location-id-1')
		expect(apiRulesListMock).toHaveBeenCalledWith('location-id-2')

		expect(apiLocationsGetMock).not.toHaveBeenCalled()
		expect(apiRulesGetMock).not.toHaveBeenCalled()
	})

	it('throws an error when no location is found', async () => {
		apiLocationsListMock.mockResolvedValueOnce([])
		fatalErrorMock.mockImplementationOnce(() => { throw Error('no locations') })

		await expect(getRulesByLocation(client)).rejects.toThrow('no locations')

		expect(apiLocationsListMock).toHaveBeenCalledTimes(1)
		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith(
			'Could not find any locations for your account. Perhaps ' +
			"you haven't created any locations yet.",
		)

		expect(apiLocationsGetMock).not.toHaveBeenCalled()
		expect(apiRulesGetMock).not.toHaveBeenCalled()
		expect(apiRulesListMock).not.toHaveBeenCalled()
	})
})

describe('getRuleWithLocation', () => {
	it('uses simple location lookup when locationId specified', async () => {
		apiLocationsGetMock.mockResolvedValueOnce(location1)
		apiRulesGetMock.mockResolvedValueOnce(rule1)

		expect(await getRuleWithLocation(client, 'rule-id-1', 'location-id-1')).toEqual(rule1WithLocation)

		expect(apiLocationsGetMock).toHaveBeenCalledExactlyOnceWith('location-id-1')
		expect(apiRulesGetMock).toHaveBeenCalledExactlyOnceWith('rule-id-1', 'location-id-1')

		expect(apiLocationsListMock).not.toHaveBeenCalled()
		expect(apiRulesListMock).not.toHaveBeenCalled()
		expect(fatalErrorMock).not.toHaveBeenCalled()
	})

	it('searches for rule in all locations when no location id specified', async () => {
		apiLocationsListMock.mockResolvedValueOnce([locationItem1])
		apiRulesListMock.mockResolvedValueOnce([rule1])

		expect(await getRuleWithLocation(client, 'rule-id-1')).toStrictEqual(rule1WithLocation)

		expect(apiLocationsListMock).toHaveBeenCalledExactlyOnceWith()
		expect(apiRulesListMock).toHaveBeenCalledExactlyOnceWith('location-id-1')

		expect(apiLocationsGetMock).not.toHaveBeenCalled()
		expect(apiRulesGetMock).not.toHaveBeenCalled()
	})

	it('throws error when no rule found when searching', async () => {
		apiLocationsListMock.mockResolvedValueOnce([locationItem1, locationItem2])
		apiRulesListMock.mockResolvedValueOnce([rule1])
		apiRulesListMock.mockResolvedValueOnce([rule2])
		fatalErrorMock.mockImplementationOnce(() => { throw Error('no locations') })

		await expect(getRuleWithLocation(client, 'rule-id-3')).rejects
			.toThrow('no locations')

		expect(apiLocationsListMock).toHaveBeenCalledExactlyOnceWith()
		expect(apiRulesListMock).toHaveBeenCalledTimes(2)
		expect(apiRulesListMock).toHaveBeenCalledWith('location-id-1')
		expect(apiRulesListMock).toHaveBeenCalledWith('location-id-2')
		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith('could not find rule with id rule-id-3 in any location')

		expect(apiLocationsGetMock).not.toHaveBeenCalled()
		expect(apiRulesGetMock).not.toHaveBeenCalled()
	})
})
