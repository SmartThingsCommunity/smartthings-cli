import { jest } from '@jest/globals'

import { selectFromList, SelectFromListFlags } from '../../../../lib/command/select.js'
import { APICommand } from '../../../../lib/command/api-command.js'
import { LocationItem, LocationsEndpoint } from '@smartthings/core-sdk'
import {
	chooseOptionsDefaults,
	chooseOptionsWithDefaults,
	stringTranslateToId,
} from '../../../../lib/command/command-util.js'


const chooseOptionsWithDefaultsMock = jest.fn<typeof chooseOptionsWithDefaults>()
const stringTranslateToIdMock = jest.fn<typeof stringTranslateToId>()
jest.unstable_mockModule('../../../../lib/command/command-util.js', () => ({
	chooseOptionsDefaults,
	chooseOptionsWithDefaults: chooseOptionsWithDefaultsMock,
	stringTranslateToId: stringTranslateToIdMock,
}))

const selectFromListMock = jest.fn<typeof selectFromList>()
jest.unstable_mockModule('../../../../lib/command/select.js', () => ({
	selectFromList: selectFromListMock,
}))


const { chooseLocation } = await import('../../../../lib/command/util/locations-util.js')

test('chooseLocation uses correct endpoint to list locations', async () => {
	selectFromListMock.mockResolvedValue('selected-location-id')
	chooseOptionsWithDefaultsMock.mockReturnValue(chooseOptionsDefaults())

	const apiLocationsListMock = jest.fn<typeof LocationsEndpoint.prototype.list>()
	const command = {
		client: {
			locations: {
				list: apiLocationsListMock,
			},
		},
	} as unknown as APICommand<SelectFromListFlags>

	expect(await chooseLocation(command)).toBe('selected-location-id')

	const listItems = selectFromListMock.mock.calls[0][2].listItems
	const locationList = [{ locationId: 'listed-location-id' } as LocationItem]
	apiLocationsListMock.mockResolvedValueOnce(locationList)

	expect(await listItems()).toBe(locationList)

	expect(apiLocationsListMock).toHaveBeenCalledTimes(1)
	expect(apiLocationsListMock).toHaveBeenCalledWith()
})
