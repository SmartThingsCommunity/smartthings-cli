import { jest } from '@jest/globals'

import type {
	DevicePreference,
	DevicePreferencesEndpoint,
	SmartThingsClient,
} from '@smartthings/core-sdk'

import type { ValueTableFieldDefinition } from '../../../../lib/table-generator.js'
import type { ChooseFunction, createChooseFn } from '../../../../lib/command/util/util-util.js'


const createChooseFnMock = jest.fn<typeof createChooseFn<DevicePreference>>()
jest.unstable_mockModule('../../../../lib/command/util/util-util.js', () => ({
	createChooseFn: createChooseFnMock,
}))


const {
	chooseDevicePreferenceFn,
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
	const chooseAppMock = jest.fn<ChooseFunction<DevicePreference>>()
	createChooseFnMock.mockReturnValueOnce(chooseAppMock)

	const chooseApp = chooseDevicePreferenceFn()

	expect(chooseApp).toBe(chooseAppMock)

	expect(createChooseFnMock).toHaveBeenCalledExactlyOnceWith(
		expect.objectContaining({ itemName: 'device preference' }),
		expect.any(Function),
	)

	const devicePreferenceList = [{ preferenceId: 'device-preference-id' } as DevicePreference]
	const apiDevicePreferencesListMock = jest.fn<typeof DevicePreferencesEndpoint.prototype.list>()
		.mockResolvedValueOnce(devicePreferenceList)
	const listItems = createChooseFnMock.mock.calls[0][1]
	const client = {
		devicePreferences: {
			list: apiDevicePreferencesListMock,
		},
	} as unknown as SmartThingsClient

	expect(await listItems(client)).toBe(devicePreferenceList)

	expect(apiDevicePreferencesListMock).toHaveBeenCalledExactlyOnceWith()
})
