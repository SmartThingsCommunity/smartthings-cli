import { jest } from '@jest/globals'

import { DevicePreference, DevicePreferencesEndpoint, SmartThingsClient } from '@smartthings/core-sdk'

import { APICommand } from '../../../../lib/command/api-command.js'
import { SelectFromListFlags, selectFromList } from '../../../../lib/command/select.js'
import { ValueTableFieldDefinition } from '../../../../lib/table-generator.js'


const selectFromListMock = jest.fn<typeof selectFromList>()
jest.unstable_mockModule('../../../../lib/command/select', () => ({
	selectFromList: selectFromListMock,
}))


const {
	chooseDevicePreference,
	tableFieldDefinitions,
} = await import('../../../../lib/command/util/devicepreferences-util.js')


describe('tableFieldDefinitions options definition', () => {
	const value = (tableFieldDefinitions[12] as
		ValueTableFieldDefinition<DevicePreference>).value as (input: DevicePreference) => string

	it('returns undefined for non-enumeration preferences', () => {
		expect(value({ preferenceType: 'string' } as DevicePreference)).toBe(undefined)
	})

	it.each`
		options                     | expected
		${[]}                       | ${''}
		${['not much of a choice']} | ${'0: not much of a choice'}
		${['MK3S+', 'MK4', 'XL']}   | ${'0: MK3S+\n1: MK4\n2: XL'}
	`('summarizes $options as $expected', ({ options, expected }) => {
		const preference = { preferenceType: 'enumeration', definition: { options } } as DevicePreference
		expect(value(preference)).toBe(expected)
	})
})

test('chooseDevicePreference', async () => {
	selectFromListMock.mockResolvedValueOnce('chosen-id')
	const listMock = jest.fn<typeof DevicePreferencesEndpoint.prototype.list>()
	const client = { devicePreferences: { list: listMock } } as unknown as SmartThingsClient
	const command = { client } as APICommand<SelectFromListFlags>

	expect(await chooseDevicePreference(command, 'preselected-id')).toBe('chosen-id')

	expect(selectFromListMock).toHaveBeenCalledTimes(1)
	expect(selectFromListMock).toHaveBeenCalledWith(
		command,
		expect.objectContaining({ itemName: 'device preference' }),
		{
			preselectedId: 'preselected-id',
			listItems: expect.any(Function),
		},
	)

	const listItems = selectFromListMock.mock.calls[0][2].listItems
	const devicePreferenceList = [{ preferenceId: 'device-preference-id' } as DevicePreference]
	listMock.mockResolvedValueOnce(devicePreferenceList)

	expect(await listItems()).toBe(devicePreferenceList)

	expect(listMock).toHaveBeenCalledTimes(1)
	expect(listMock).toHaveBeenCalledWith()
})
