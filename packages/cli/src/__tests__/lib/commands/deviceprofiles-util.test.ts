import {
	DeviceProfile,
	DeviceProfilePreferenceRequest,
	DeviceProfileStatus,
	PresentationDeviceConfigEntry,
} from '@smartthings/core-sdk'

import { summarizedText, Table, TableGenerator } from '@smartthings/cli-lib'

import { buildTableOutput, entryValues } from '../../../lib/commands/deviceprofiles-util'
import * as deviceprofilesUtil from '../../../lib/commands/deviceprofiles-util'


describe('entryValues', () => {
	it('returns empty string for empty list', () => {
		expect(entryValues([])).toBe('')
	})

	it.each`
		input                                          | result
		${{ component: 'main', capability: 'cap-id' }} | ${'main/cap-id'}
		${{ component: '', capability: 'cap-id' }}     | ${'cap-id'}
	`('converts $input to $result', ({ input, result }) => {
		expect(entryValues([input])).toBe(result)
	})

	it('combines items with new-lines', () => {
		const entries = [
			{ component: 'main', capability: 'capability-1' },
			{ component: 'second', capability: 'capability-2' },
		]
		expect(entryValues(entries)).toBe('main/capability-1\nsecond/capability-2')
	})
})

describe('buildTableOutput', () => {
	const pushMock = jest.fn()
	const tableToStringMock = jest.fn().mockReturnValue('table-output')
	const mockTable = {
		push: pushMock,
		toString: tableToStringMock,
	} as Table
	const newOutputTableMock = jest.fn().mockReturnValue(mockTable)
	const buildTableFromListMock = jest.fn().mockReturnValue('table from list')
	const tableGenerator = {
		newOutputTable: newOutputTableMock,
		buildTableFromList: buildTableFromListMock,
	} as unknown as TableGenerator

	const entryValuesSpy = jest.spyOn(deviceprofilesUtil, 'entryValues')

	const baseDeviceProfile: DeviceProfile = {
		id: 'device-profile-id',
		name:'Device Profile',
		components: [],
		status: DeviceProfileStatus.PUBLISHED,
	}

	it('includes basic info', () => {
		expect(buildTableOutput(tableGenerator, baseDeviceProfile)).toBe(`table-output\n\n${summarizedText}`)

		expect(newOutputTableMock).toHaveBeenCalledTimes(1)
		expect(newOutputTableMock).toHaveBeenCalledWith()
		expect(pushMock).toHaveBeenCalledTimes(7)
		expect(pushMock).toHaveBeenCalledWith(['Name', 'Device Profile'])
		expect(pushMock).toHaveBeenCalledWith(['Id', 'device-profile-id'])
		expect(pushMock).toHaveBeenCalledWith(['Device Type', ''])
		expect(pushMock).toHaveBeenCalledWith(['OCF Device Type', ''])
		expect(pushMock).toHaveBeenCalledWith(['Manufacturer Name', ''])
		expect(pushMock).toHaveBeenCalledWith(['Presentation Id', ''])
		expect(pushMock).toHaveBeenCalledWith(['Status', 'PUBLISHED'])
		expect(buildTableFromListMock).toHaveBeenCalledTimes(0)
	})

	it('includes metadata', () => {
		const deviceProfile = {
			...baseDeviceProfile,
			metadata: {
				deviceType: 'device-type',
				ocfDeviceType: 'ocf-device-type',
				mnmn: 'manufacturer-name',
				vid: 'presentation-id',
			},
		}

		expect(buildTableOutput(tableGenerator, deviceProfile)).toBe(`table-output\n\n${summarizedText}`)

		expect(newOutputTableMock).toHaveBeenCalledTimes(1)
		expect(newOutputTableMock).toHaveBeenCalledWith()
		expect(pushMock).toHaveBeenCalledTimes(7)
		expect(pushMock).toHaveBeenCalledWith(['Device Type', 'device-type'])
		expect(pushMock).toHaveBeenCalledWith(['OCF Device Type', 'ocf-device-type'])
		expect(pushMock).toHaveBeenCalledWith(['Manufacturer Name', 'manufacturer-name'])
		expect(pushMock).toHaveBeenCalledWith(['Presentation Id', 'presentation-id'])
		expect(buildTableFromListMock).toHaveBeenCalledTimes(0)
	})

	it('includes components with capabilities', () => {
		const deviceProfile = {
			...baseDeviceProfile,
			components: [
				{ id: 'main', capabilities: [{ id: 'switch', version: 1 }] },
				{ id: 'second', capabilities: [{ id: 'switch', version: 1 }, { id: 'cap-2', version: 1 }] },
				{ id: 'third' },
			],
		}

		expect(buildTableOutput(tableGenerator, deviceProfile)).toBe(`table-output\n\n${summarizedText}`)

		expect(newOutputTableMock).toHaveBeenCalledTimes(1)
		expect(newOutputTableMock).toHaveBeenCalledWith()
		expect(pushMock).toHaveBeenCalledTimes(10)
		expect(pushMock).toHaveBeenCalledWith(['main component', 'switch'])
		expect(pushMock).toHaveBeenCalledWith(['second component', 'switch\ncap-2'])
		expect(pushMock).toHaveBeenCalledWith(['third component', ''])
		expect(buildTableFromListMock).toHaveBeenCalledTimes(0)
	})

	it('includes dashboard info when view info requested', () => {
		const states = [{ component: 'main' } as PresentationDeviceConfigEntry]
		const actions = [{ component: 'second' } as PresentationDeviceConfigEntry]
		const deviceProfile = {
			...baseDeviceProfile,
			view: { dashboard: { states, actions } },
		}

		entryValuesSpy
			.mockReturnValueOnce('state entries')
			.mockReturnValueOnce('action entries')

		expect(buildTableOutput(tableGenerator, deviceProfile, { includeViewInfo: true }))
			.toBe(`table-output\n\n${summarizedText}`)

		expect(newOutputTableMock).toHaveBeenCalledTimes(1)
		expect(newOutputTableMock).toHaveBeenCalledWith()
		expect(entryValuesSpy).toHaveBeenCalledTimes(2)
		expect(entryValuesSpy).toHaveBeenCalledWith(states)
		expect(entryValuesSpy).toHaveBeenCalledWith(actions)
		expect(pushMock).toHaveBeenCalledTimes(9)
		expect(pushMock).toHaveBeenCalledWith(['Dashboard states', 'state entries'])
		expect(pushMock).toHaveBeenCalledWith(['Dashboard actions', 'action entries'])
		expect(buildTableFromListMock).toHaveBeenCalledTimes(0)
	})

	it('includes detail view when view info requested', () => {
		const detailView = [{ component: 'main' } as PresentationDeviceConfigEntry]
		const deviceProfile = {
			...baseDeviceProfile,
			view: { detailView },
		}

		entryValuesSpy
			.mockReturnValueOnce('detail view entries')

		expect(buildTableOutput(tableGenerator, deviceProfile, { includeViewInfo: true }))
			.toBe(`table-output\n\n${summarizedText}`)

		expect(newOutputTableMock).toHaveBeenCalledTimes(1)
		expect(newOutputTableMock).toHaveBeenCalledWith()
		expect(entryValuesSpy).toHaveBeenCalledTimes(1)
		expect(entryValuesSpy).toHaveBeenCalledWith(detailView)
		expect(pushMock).toHaveBeenCalledTimes(8)
		expect(pushMock).toHaveBeenCalledWith(['Detail view', 'detail view entries'])
		expect(buildTableFromListMock).toHaveBeenCalledTimes(0)
	})

	it('includes automation conditions info when view info requested', () => {
		const conditions = [{ component: 'main' } as PresentationDeviceConfigEntry]
		const actions = [{ component: 'second' } as PresentationDeviceConfigEntry]
		const deviceProfile = {
			...baseDeviceProfile,
			view: { automation: { conditions, actions } },
		}

		entryValuesSpy
			.mockReturnValueOnce('condition entries')
			.mockReturnValueOnce('action entries')

		expect(buildTableOutput(tableGenerator, deviceProfile, { includeViewInfo: true }))
			.toBe(`table-output\n\n${summarizedText}`)

		expect(newOutputTableMock).toHaveBeenCalledTimes(1)
		expect(newOutputTableMock).toHaveBeenCalledWith()
		expect(entryValuesSpy).toHaveBeenCalledTimes(2)
		expect(entryValuesSpy).toHaveBeenCalledWith(conditions)
		expect(entryValuesSpy).toHaveBeenCalledWith(actions)
		expect(pushMock).toHaveBeenCalledTimes(9)
		expect(pushMock).toHaveBeenCalledWith(['Automation conditions', 'condition entries'])
		expect(pushMock).toHaveBeenCalledWith(['Automation actions', 'action entries'])
		expect(buildTableFromListMock).toHaveBeenCalledTimes(0)
	})

	it('includes "No Preferences" message when preferences requested but not included', () => {
		const deviceProfile = {
			...baseDeviceProfile,
		}

		entryValuesSpy
			.mockReturnValueOnce('state entries')
			.mockReturnValueOnce('action entries')

		expect(buildTableOutput(tableGenerator, deviceProfile, { includePreferences: true }))
			.toBe(`Basic Information\ntable-output\n\nNo preferences\n\n${summarizedText}`)

		expect(newOutputTableMock).toHaveBeenCalledTimes(1)
		expect(newOutputTableMock).toHaveBeenCalledWith()
		expect(pushMock).toHaveBeenCalledTimes(7)
		expect(buildTableFromListMock).toHaveBeenCalledTimes(0)
	})

	it('includes preferences requested', () => {
		const deviceProfile = {
			...baseDeviceProfile,
			preferences: [{ title: 'pref-request' } as DeviceProfilePreferenceRequest],
		}
		buildTableFromListMock.mockReturnValueOnce('preferences-table')

		entryValuesSpy
			.mockReturnValueOnce('state entries')
			.mockReturnValueOnce('action entries')

		expect(buildTableOutput(tableGenerator, deviceProfile, { includePreferences: true }))
			.toBe(`Basic Information\ntable-output\n\nDevice Preferences\npreferences-table\n\n${summarizedText}`)

		expect(newOutputTableMock).toHaveBeenCalledTimes(1)
		expect(newOutputTableMock).toHaveBeenCalledWith()
		expect(pushMock).toHaveBeenCalledTimes(7)
		expect(buildTableFromListMock).toHaveBeenCalledTimes(1)
		expect(buildTableFromListMock).toHaveBeenCalledWith(
			deviceProfile.preferences,
			expect.arrayContaining(['preferenceId', 'title']),
		)
	})
})
