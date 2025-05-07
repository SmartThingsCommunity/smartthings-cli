import { jest } from '@jest/globals'

import { fatalError } from '../../../../lib/util.js'
import type { selectFromList } from '../../../../lib/command/select.js'
import type { chooseLocation } from '../../../../lib/command/util/locations-util.js'
import { getModesWithLocation } from '../../../../lib/command/util/modes.js'
import type { APICommand } from '../../../../lib/command/api-command.js'


const fatalErrorMock = jest.fn<typeof fatalError>().mockReturnValue('never return' as never)
jest.unstable_mockModule('../../../../lib/util.js', () => ({
	fatalError: fatalErrorMock,
}))

const selectFromListMock = jest.fn<typeof selectFromList>()
jest.unstable_mockModule('../../../../lib/command/select.js', () => ({
	selectFromList: selectFromListMock,
}))

const chooseLocationMock = jest.fn<typeof chooseLocation>()
jest.unstable_mockModule('../../../../lib/command/util/locations-util.js', () => ({
	chooseLocation: chooseLocationMock,
}))

const getModesWithLocationMock = jest.fn<typeof getModesWithLocation>()
jest.unstable_mockModule('../../../../lib/command/util/modes.js', () => ({
	getModesWithLocation: getModesWithLocationMock,
}))


const { chooseMode } = await import('../../../../lib/command/util/modes-choose.js')


describe('chooseMode', () => {
	const command = { client: { modes: {} } } as APICommand

	chooseLocationMock.mockResolvedValue('chosen-location-id')
	const modeWithLocation1 = {
		id: 'mode-id-1',
		locationId: 'location-id',
		name: 'Mode1',
	}
	const modeWithLocation2 = {
		id: 'mode-id-2',
		locationId: 'location-id',
		name: 'Mode2',
	}
	const modesWithLocation = [modeWithLocation1, modeWithLocation2]
	getModesWithLocationMock.mockResolvedValue(modesWithLocation)
	selectFromListMock.mockResolvedValue('mode-id-1')

	it('throws error when mode not found', async () => {
		getModesWithLocationMock.mockResolvedValueOnce([])
		expect(await chooseMode(command)).toBe('never return')
		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith('could not find mode with id mode-id-1')
	})

	it('throws error when locationId is missing', async () => {
		getModesWithLocationMock.mockResolvedValueOnce([{
			id: 'mode-id-1',
			name: 'test',
		}])

		expect(await chooseMode(command)).toBe('never return')

		expect(chooseLocationMock).toHaveBeenCalledExactlyOnceWith(command, undefined, { allowIndex: true })
		expect(getModesWithLocationMock).toHaveBeenCalledExactlyOnceWith(command.client, 'chosen-location-id')
		expect(fatalErrorMock).toHaveBeenCalledExactlyOnceWith('could not determine location id for mode mode-id-1')
	})

	it('returns mode tuple when mode is found', async () => {
		expect(await chooseMode(command, 'location-id')).toStrictEqual(['mode-id-1', 'location-id'])

		const listItems = selectFromListMock.mock.calls[0][2].listItems

		// Multiple calls to listItems should not result in more than 1 call to getModesWithLocation
		expect(await listItems()).toBe(modesWithLocation)
		expect(await listItems()).toBe(modesWithLocation)

		expect(getModesWithLocationMock).toHaveBeenCalledTimes(1)
	})

	it('calls selectFromList with correct config', async () => {
		expect(await chooseMode(command, 'mode-id-1')).toStrictEqual(['mode-id-1', 'location-id'])

		expect(selectFromListMock).toHaveBeenCalledWith(
			command,
			{
				itemName: 'mode',
				primaryKeyName: 'id',
				sortKeyName: 'label',
				listTableFieldDefinitions: expect.anything(),
			},
			{ preselectedId: 'mode-id-1', autoChoose: undefined, listItems: expect.any(Function) },
		)
	})

	it('passes on locationId when retrieving modes', async () => {
		chooseLocationMock.mockResolvedValueOnce('location-id')

		expect(await chooseMode(command, undefined, { locationId: 'location-id' }))
			.toStrictEqual(['mode-id-1', 'location-id'])

		expect(chooseLocationMock).toHaveBeenCalledExactlyOnceWith(command, 'location-id', { allowIndex: true })
		expect(getModesWithLocationMock).toHaveBeenCalledExactlyOnceWith(command.client, 'location-id')
	})
})
