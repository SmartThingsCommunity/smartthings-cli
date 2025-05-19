import {
	type DeviceComponent,
	type DeviceProfile,
	type DeviceProfilePreferenceRequest,
	DeviceProfileStatus,
	type PresentationDeviceConfigEntry,
} from '@smartthings/core-sdk'

import {
	buildTableFromListMock,
	mockedTableOutput,
	newOutputTableMock,
	tableGeneratorMock,
	tablePushMock,
} from '../../../test-lib/table-mock.js'


const {
	buildTableOutput,
	cleanupForCreate,
	cleanupForUpdate,
	entryValues,
} = await import('../../../../lib/command/util/deviceprofiles-util.js')


const baseDeviceProfileCreate = {
	name:'Device Profile',
	components: [],
}
const baseDeviceProfile: DeviceProfile & { restrictions: unknown } = {
	...baseDeviceProfileCreate,
	id: 'device-profile-id',
	status: DeviceProfileStatus.PUBLISHED,
	restrictions: 'some restrictions',
}
const componentsWithoutLabels: DeviceComponent[] = [
	{ id: 'main', capabilities: [{ id: 'switch', version: 1 }] },
	{
		id: 'second',
		capabilities: [{ id: 'switch', version: 1 }, { id: 'cap-2', version: 1 }],
	},
	{ id: 'third' },
]
const components: DeviceComponent[] = [
	componentsWithoutLabels[0],
	{ ...componentsWithoutLabels[1], label: 'Second Component' },
	{ ...componentsWithoutLabels[2], label: 'Third Component' },
]


describe('entryValues', () => {
	it('returns empty string for empty list', () => {
		expect(entryValues([])).toBe('')
	})

	it.each([
		{ input: { component: 'main', capability: 'cap-id' }, result: 'main/cap-id' },
		{ input: { capability: 'cap-id' }, result: 'cap-id' },
	])('converts $input to $result', ({ input, result }) => {
		expect(entryValues([input])).toBe(result)
	})

	it('combines items with newlines', () => {
		const entries = [
			{ component: 'main', capability: 'capability-1' },
			{ component: 'second', capability: 'capability-2' },
		]
		expect(entryValues(entries)).toBe('main/capability-1\nsecond/capability-2')
	})
})

describe('buildTableOutput', () => {
	it('includes basic info', () => {
		expect(buildTableOutput(tableGeneratorMock, baseDeviceProfile)).toBe(mockedTableOutput)

		expect(newOutputTableMock).toHaveBeenCalledExactlyOnceWith()
		expect(tablePushMock).toHaveBeenCalledTimes(7)
		expect(tablePushMock).toHaveBeenCalledWith(['Name', 'Device Profile'])
		expect(tablePushMock).toHaveBeenCalledWith(['Id', 'device-profile-id'])
		expect(tablePushMock).toHaveBeenCalledWith(['Device Type', ''])
		expect(tablePushMock).toHaveBeenCalledWith(['OCF Device Type', ''])
		expect(tablePushMock).toHaveBeenCalledWith(['Manufacturer Name', ''])
		expect(tablePushMock).toHaveBeenCalledWith(['Presentation Id', ''])
		expect(tablePushMock).toHaveBeenCalledWith(['Status', 'PUBLISHED'])
		expect(buildTableFromListMock).not.toHaveBeenCalled()
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

		expect(buildTableOutput(tableGeneratorMock, deviceProfile)).toBe(mockedTableOutput)

		expect(newOutputTableMock).toHaveBeenCalledExactlyOnceWith()
		expect(tablePushMock).toHaveBeenCalledTimes(7)
		expect(tablePushMock).toHaveBeenCalledWith(['Device Type', 'device-type'])
		expect(tablePushMock).toHaveBeenCalledWith(['OCF Device Type', 'ocf-device-type'])
		expect(tablePushMock).toHaveBeenCalledWith(['Manufacturer Name', 'manufacturer-name'])
		expect(tablePushMock).toHaveBeenCalledWith(['Presentation Id', 'presentation-id'])
		expect(buildTableFromListMock).not.toHaveBeenCalled()
	})

	it('includes components with capabilities', () => {
		const deviceProfile = { ...baseDeviceProfile, components }

		expect(buildTableOutput(tableGeneratorMock, deviceProfile)).toBe(mockedTableOutput)

		expect(newOutputTableMock).toHaveBeenCalledExactlyOnceWith()
		expect(tablePushMock).toHaveBeenCalledTimes(10)
		expect(tablePushMock).toHaveBeenCalledWith(['main component', 'switch'])
		expect(tablePushMock).toHaveBeenCalledWith(['second component', 'switch\ncap-2'])
		expect(tablePushMock).toHaveBeenCalledWith(['third component', ''])
		expect(buildTableFromListMock).not.toHaveBeenCalled()
	})

	it('includes dashboard info when view info requested', () => {
		const states = [{ capability: 'switch' } as PresentationDeviceConfigEntry]
		const actions = [{ capability: 'switchLevel' } as PresentationDeviceConfigEntry]
		const deviceProfile = { ...baseDeviceProfile, view: { dashboard: { states, actions } } }

		expect(buildTableOutput(tableGeneratorMock, deviceProfile, { includeViewInfo: true }))
			.toBe(mockedTableOutput)

		expect(newOutputTableMock).toHaveBeenCalledExactlyOnceWith()
		expect(tablePushMock).toHaveBeenCalledTimes(9)
		expect(tablePushMock).toHaveBeenCalledWith(['Dashboard states', 'switch'])
		expect(tablePushMock).toHaveBeenCalledWith(['Dashboard actions', 'switchLevel'])
		expect(buildTableFromListMock).not.toHaveBeenCalled()
	})

	it('includes detail view when view info requested', () => {
		const detailView = [{ capability: 'button' } as PresentationDeviceConfigEntry]
		const deviceProfile = { ...baseDeviceProfile, view: { detailView } }

		expect(buildTableOutput(tableGeneratorMock, deviceProfile, { includeViewInfo: true }))
			.toBe(mockedTableOutput)

		expect(newOutputTableMock).toHaveBeenCalledExactlyOnceWith()
		expect(tablePushMock).toHaveBeenCalledTimes(8)
		expect(tablePushMock).toHaveBeenCalledWith(['Detail view', 'button'])
		expect(buildTableFromListMock).not.toHaveBeenCalled()
	})

	it('includes automation conditions info when view info requested', () => {
		const conditions = [{ capability: 'lock' } as PresentationDeviceConfigEntry]
		const actions = [{ capability: 'refresh' } as PresentationDeviceConfigEntry]
		const deviceProfile = {
			...baseDeviceProfile,
			view: { automation: { conditions, actions } },
		}

		expect(buildTableOutput(tableGeneratorMock, deviceProfile, { includeViewInfo: true }))
			.toBe(mockedTableOutput)

		expect(newOutputTableMock).toHaveBeenCalledExactlyOnceWith()
		expect(tablePushMock).toHaveBeenCalledTimes(9)
		expect(tablePushMock).toHaveBeenCalledWith(['Automation conditions', 'lock'])
		expect(tablePushMock).toHaveBeenCalledWith(['Automation actions', 'refresh'])
		expect(buildTableFromListMock).not.toHaveBeenCalled()
	})

	it('includes "No Preferences" message when preferences requested but not included', () => {
		const deviceProfile = {
			...baseDeviceProfile,
		}

		expect(buildTableOutput(tableGeneratorMock, deviceProfile, { includePreferences: true }))
			.toBe(`Basic Information\n${mockedTableOutput}\n\nNo preferences`)

		expect(newOutputTableMock).toHaveBeenCalledExactlyOnceWith()
		expect(tablePushMock).toHaveBeenCalledTimes(7)
		expect(buildTableFromListMock).not.toHaveBeenCalled()
	})

	it('includes preferences requested', () => {
		const deviceProfile = {
			...baseDeviceProfile,
			preferences: [{ title: 'pref-request' } as DeviceProfilePreferenceRequest],
		}
		buildTableFromListMock.mockReturnValueOnce('preferences-table')

		expect(buildTableOutput(tableGeneratorMock, deviceProfile, { includePreferences: true }))
			.toBe(`Basic Information\n${mockedTableOutput}\n\nDevice Preferences\npreferences-table`)

		expect(newOutputTableMock).toHaveBeenCalledExactlyOnceWith()
		expect(tablePushMock).toHaveBeenCalledTimes(7)
		expect(buildTableFromListMock).toHaveBeenCalledExactlyOnceWith(
			deviceProfile.preferences,
			expect.arrayContaining(['preferenceId', 'title']),
		)
	})
})

test('cleanupForCreate', () => {
	expect(cleanupForCreate({ ...baseDeviceProfile, components })).toStrictEqual({
		...baseDeviceProfileCreate,
		components: componentsWithoutLabels,
	})
})

test('cleanupForUpdate', () => {
	expect(cleanupForUpdate({ ...baseDeviceProfile, components })).toStrictEqual({
		components: componentsWithoutLabels,
	})
})
