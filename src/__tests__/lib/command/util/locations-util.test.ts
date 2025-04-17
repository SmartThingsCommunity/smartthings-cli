import { jest } from '@jest/globals'

import type { LocationItem, LocationsEndpoint } from '@smartthings/core-sdk'
import type { stringTranslateToId } from '../../../../lib/command/command-util.js'
import type { createChooseFn, ChooseFunction } from '../../../../lib/command/util/util-util.js'
import { APICommand } from '../../../../lib/command/api-command.js'


const stringTranslateToIdMock = jest.fn<typeof stringTranslateToId>()
jest.unstable_mockModule('../../../../lib/command/command-util.js', () => ({
	stringTranslateToId: stringTranslateToIdMock,
}))

const createChooseFnMock = jest.fn<typeof createChooseFn<LocationItem>>()
jest.unstable_mockModule('../../../../lib/command/util/util-util.js', () => ({
	createChooseFn: createChooseFnMock,
}))


const { chooseLocationFn } = await import('../../../../lib/command/util/locations-util.js')

test('chooseLocationFn uses correct endpoint to list locations', async () => {
	const chooseLocationMock = jest.fn<ChooseFunction<LocationItem>>()
	createChooseFnMock.mockReturnValueOnce(chooseLocationMock)

	const chooseLocation = chooseLocationFn()

	expect(chooseLocation).toBe(chooseLocationMock)

	expect(createChooseFnMock).toHaveBeenCalledExactlyOnceWith(
		expect.objectContaining({ itemName: 'location' }),
		expect.any(Function),
	)

	const locationList = [{ locationId: 'listed-location-id' } as LocationItem]
	const apiLocationsListMock = jest.fn<typeof LocationsEndpoint.prototype.list>()
		.mockResolvedValueOnce(locationList)
	const listItems = createChooseFnMock.mock.calls[0][1]
	const command = {
		client: {
			locations: {
				list: apiLocationsListMock,
			},
		},
	} as unknown as APICommand

	expect(await listItems(command)).toBe(locationList)

	expect(apiLocationsListMock).toHaveBeenCalledExactlyOnceWith()
})
