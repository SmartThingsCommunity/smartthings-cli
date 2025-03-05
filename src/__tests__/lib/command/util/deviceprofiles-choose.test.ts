import { jest } from '@jest/globals'

import type {
	DeviceProfile,
	DeviceProfilesEndpoint,
	LocaleReference,
	SmartThingsClient,
} from '@smartthings/core-sdk'

import type { WithLocales } from '../../../../lib/api-helpers.js'
import { createChooseFn, ChooseFunction } from '../../../../lib/command/util/util-util.js'


const createChooseFnMock = jest.fn<typeof createChooseFn<DeviceProfile & WithLocales>>()
jest.unstable_mockModule('../../../../lib/command/util/util-util.js', () => ({
	createChooseFn: createChooseFnMock,
}))


const { chooseDeviceProfileFn } = await import('../../../../lib/command/util/deviceprofiles-choose.js')


describe('chooseDeviceProfileFn', () => {
	const chooseDeviceProfileMock = jest.fn<ChooseFunction<DeviceProfile & WithLocales>>()
	createChooseFnMock.mockReturnValue(chooseDeviceProfileMock)
	const deviceProfiles = [{ id: 'device-profile-id' } as DeviceProfile]
	const apiDeviceProfilesListMock = jest.fn<typeof DeviceProfilesEndpoint.prototype.list>()
		.mockResolvedValue(deviceProfiles)
	const locales = [{ tag: 'es_MX' }, { tag: 'en_CA' }, { tag: 'fr_CA' }] as LocaleReference[]
	const apiDeviceProfilesListLocalesMock = jest.fn<typeof DeviceProfilesEndpoint.prototype.listLocales>()
		.mockResolvedValue(locales)
	const client = {
		deviceProfiles: {
			list: apiDeviceProfilesListMock,
			listLocales: apiDeviceProfilesListLocalesMock,
		},
	} as unknown as SmartThingsClient

	it('uses correct endpoint to list device profiles', async () => {
		const chooseDeviceProfile = chooseDeviceProfileFn()

		expect(chooseDeviceProfile).toBe(chooseDeviceProfileMock)

		expect(createChooseFnMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({
				itemName: 'device profile',
				listTableFieldDefinitions: expect.not.arrayContaining(['locales']),
			}),
			expect.any(Function),
		)

		const listItems = createChooseFnMock.mock.calls[0][1]

		expect(await listItems(client)).toBe(deviceProfiles)

		expect(apiDeviceProfilesListMock).toHaveBeenCalledExactlyOnceWith()

		expect(apiDeviceProfilesListLocalesMock).not.toHaveBeenCalled()
	})

	it('includes locale information with `verbose` option', async () => {
		const chooseDeviceProfile = chooseDeviceProfileFn({ verbose: true })

		expect(chooseDeviceProfile).toBe(chooseDeviceProfileMock)

		expect(createChooseFnMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({
				itemName: 'device profile',
				listTableFieldDefinitions: expect.arrayContaining(['locales']),
			}),
			expect.any(Function),
		)

		const listItems = createChooseFnMock.mock.calls[0][1]

		expect(await listItems(client)).toStrictEqual([{
			id: 'device-profile-id',
			locales: 'en_CA, es_MX, fr_CA',
		}])

		expect(apiDeviceProfilesListMock).toHaveBeenCalledExactlyOnceWith()
		expect(apiDeviceProfilesListLocalesMock).toHaveBeenCalledExactlyOnceWith('device-profile-id')
		expect(apiDeviceProfilesListLocalesMock).toHaveBeenCalled()
	})

	it('handles device profiles with no locales', async () => {
		const chooseDeviceProfile = chooseDeviceProfileFn({ verbose: true })

		expect(chooseDeviceProfile).toBe(chooseDeviceProfileMock)

		expect(createChooseFnMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({
				itemName: 'device profile',
				listTableFieldDefinitions: expect.arrayContaining(['locales']),
			}),
			expect.any(Function),
		)

		const listItems = createChooseFnMock.mock.calls[0][1]
		apiDeviceProfilesListLocalesMock.mockImplementationOnce(() => { throw { message: 'status code 404' } })

		expect(await listItems(client)).toStrictEqual([{
			id: 'device-profile-id',
		}])

		expect(apiDeviceProfilesListMock).toHaveBeenCalledExactlyOnceWith()
		expect(apiDeviceProfilesListLocalesMock).toHaveBeenCalledExactlyOnceWith('device-profile-id')
	})

	it('rethrows non-404 errors from locale API call', async () => {
		const chooseDeviceProfile = chooseDeviceProfileFn({ verbose: true })

		expect(chooseDeviceProfile).toBe(chooseDeviceProfileMock)

		expect(createChooseFnMock).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({
				itemName: 'device profile',
				listTableFieldDefinitions: expect.arrayContaining(['locales']),
			}),
			expect.any(Function),
		)

		const listItems = createChooseFnMock.mock.calls[0][1]
		apiDeviceProfilesListLocalesMock.mockImplementationOnce(() => { throw Error('other error') })

		await expect(listItems(client)).rejects.toThrow('other error')

		expect(apiDeviceProfilesListMock).toHaveBeenCalledExactlyOnceWith()
		expect(apiDeviceProfilesListLocalesMock).toHaveBeenCalledExactlyOnceWith('device-profile-id')
	})
})
