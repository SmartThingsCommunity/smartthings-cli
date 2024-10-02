import {
	DeviceProfile,
	DeviceProfilePreferenceRequest,
	DeviceProfilesEndpoint,
	DeviceProfileStatus,
	PresentationDeviceConfigEntry,
	SmartThingsClient,
} from '@smartthings/core-sdk'

import {
	APIOrganizationCommand,
	chooseOptionsDefaults,
	chooseOptionsWithDefaults,
	selectFromList,
	stringTranslateToId,
	Table,
	TableGenerator,
} from '@smartthings/cli-lib'

import {
	buildTableOutput,
	chooseDeviceProfile,
	cleanupForCreate,
	cleanupForUpdate,
	entryValues,
} from '../../../lib/commands/deviceprofiles-util.js'
import * as deviceprofilesUtil from '../../../lib/commands/deviceprofiles-util.js'


describe('chooseDeviceProfile', () => {
	const profile1 = { id: 'device-profile-1' }
	const deviceProfiles = [profile1]

	const listMock = jest.fn().mockResolvedValue(deviceProfiles)
	const listLocalesMock = jest.fn()
	const deviceProfilesMock = {
		list: listMock,
		listLocales: listLocalesMock,
	} as unknown as DeviceProfilesEndpoint
	const client = { deviceProfiles: deviceProfilesMock } as SmartThingsClient
	const command = { client } as APIOrganizationCommand<typeof APIOrganizationCommand.flags>

	const selectFromListMock = jest.mocked(selectFromList).mockResolvedValue('chosen-profile-id')
	const stringTranslateToIdMock = jest.mocked(stringTranslateToId).mockResolvedValue('translated-profile-id')
	const chooseOptionsWithDefaultsMock = jest.mocked(chooseOptionsWithDefaults)

	it('uses selectFromList', async () => {
		expect(await chooseDeviceProfile(command)).toBe('chosen-profile-id')

		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledTimes(1)
		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledWith(undefined)
		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(
			command,
			expect.objectContaining({
				itemName: 'device profile',
				listTableFieldDefinitions: ['name', 'status', 'id'],
			}),
			expect.objectContaining({ preselectedId: undefined, listItems: expect.any(Function) }),
		)
		expect(stringTranslateToIdMock).toHaveBeenCalledTimes(0)
	})

	it('includes locales when verbose is requested', async () => {
		chooseOptionsWithDefaultsMock.mockReturnValueOnce({ ...chooseOptionsDefaults(), verbose: true })

		expect(await chooseDeviceProfile(command, undefined, { verbose: true })).toBe('chosen-profile-id')

		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledTimes(1)
		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledWith({ verbose: true })
		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(
			command,
			expect.objectContaining({
				itemName: 'device profile',
				listTableFieldDefinitions: ['name', 'status', 'id', 'locales'],
			}),
			expect.objectContaining({ preselectedId: undefined, listItems: expect.any(Function) }),
		)
		expect(stringTranslateToIdMock).toHaveBeenCalledTimes(0)
	})

	it('passes on `deviceProfileFromArg`', async () => {
		expect(await chooseDeviceProfile(command, 'profile-arg')).toBe('chosen-profile-id')

		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledTimes(1)
		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledWith(undefined)
		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(
			command,
			expect.objectContaining({ itemName: 'device profile' }),
			expect.objectContaining({ preselectedId: 'profile-arg', listItems: expect.any(Function) }),
		)
		expect(stringTranslateToIdMock).toHaveBeenCalledTimes(0)
	})

	it('translates id from arg when `allowIndex` specified', async () => {
		chooseOptionsWithDefaultsMock.mockReturnValueOnce({ ...chooseOptionsDefaults(), allowIndex: true })

		expect(await chooseDeviceProfile(command, 'profile-arg', { allowIndex: true })).toBe('chosen-profile-id')

		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledTimes(1)
		expect(chooseOptionsWithDefaultsMock).toHaveBeenCalledWith({ allowIndex: true })
		expect(selectFromListMock).toHaveBeenCalledTimes(1)
		expect(selectFromListMock).toHaveBeenCalledWith(
			command,
			expect.objectContaining({ itemName: 'device profile' }),
			expect.objectContaining({ preselectedId: 'translated-profile-id', listItems: expect.any(Function) }),
		)
		expect(stringTranslateToIdMock).toHaveBeenCalledTimes(1)
		expect(stringTranslateToIdMock).toHaveBeenCalledWith(
			expect.objectContaining({ itemName: 'device profile' }),
			'profile-arg',
			expect.any(Function),
		)
	})

	describe('listItems', () => {
		it('just uses list normally', async () => {
			expect(await chooseDeviceProfile(command)).toBe('chosen-profile-id')

			expect(selectFromListMock).toHaveBeenCalledTimes(1)

			const listItems = selectFromListMock.mock.calls[0][2].listItems

			expect(await listItems()).toBe(deviceProfiles)

			expect(listMock).toHaveBeenCalledTimes(1)
			expect(listMock).toHaveBeenCalledWith()
			expect(listLocalesMock).toHaveBeenCalledTimes(0)
		})

		it('sorts and joins locales', async () => {
			chooseOptionsWithDefaultsMock.mockReturnValueOnce({ ...chooseOptionsDefaults(), verbose: true })

			expect(await chooseDeviceProfile(command)).toBe('chosen-profile-id')

			expect(selectFromListMock).toHaveBeenCalledTimes(1)

			const listItems = selectFromListMock.mock.calls[0][2].listItems
			listLocalesMock.mockResolvedValueOnce([{ tag: 'ko' }, { tag: 'en' }, { tag: 'es' }])

			expect(await listItems()).toStrictEqual([{ ...profile1, locales: 'en, es, ko' }])

			expect(listMock).toHaveBeenCalledTimes(1)
			expect(listMock).toHaveBeenCalledWith()
			expect(listLocalesMock).toHaveBeenCalledTimes(1)
			expect(listLocalesMock).toHaveBeenCalledWith('device-profile-1')
		})

		it('handles 404 from listLocales', async () => {
			chooseOptionsWithDefaultsMock.mockReturnValueOnce({ ...chooseOptionsDefaults(), verbose: true })

			expect(await chooseDeviceProfile(command)).toBe('chosen-profile-id')

			expect(selectFromListMock).toHaveBeenCalledTimes(1)

			const listItems = selectFromListMock.mock.calls[0][2].listItems
			listLocalesMock.mockImplementationOnce(() => { throw Error('status code 404') })

			expect(await listItems()).toStrictEqual([{ ...profile1, locales: '' }])

			expect(listMock).toHaveBeenCalledTimes(1)
			expect(listMock).toHaveBeenCalledWith()
			expect(listLocalesMock).toHaveBeenCalledTimes(1)
			expect(listLocalesMock).toHaveBeenCalledWith('device-profile-1')
		})

		it('rethrows non-404 error', async () => {
			chooseOptionsWithDefaultsMock.mockReturnValueOnce({ ...chooseOptionsDefaults(), verbose: true })

			expect(await chooseDeviceProfile(command)).toBe('chosen-profile-id')

			expect(selectFromListMock).toHaveBeenCalledTimes(1)

			const listItems = selectFromListMock.mock.calls[0][2].listItems
			listLocalesMock.mockImplementationOnce(() => { throw Error('unexpected') })

			await expect(listItems()).rejects.toThrow('unexpected')

			expect(listMock).toHaveBeenCalledTimes(1)
			expect(listMock).toHaveBeenCalledWith()
			expect(listLocalesMock).toHaveBeenCalledTimes(1)
			expect(listLocalesMock).toHaveBeenCalledWith('device-profile-1')
		})
	})
})

describe('convertToCreateRequest', () => {
	it('removes appropriate fields', () => {
		const expectedComponent = { id: 'component-id' }
		const expectedResult = {
			name: 'profile name',
			metadata: { field: 'value' },
			components: [expectedComponent],
		}
		const deviceProfile = {
			...expectedResult,
			id: 'old-profile-id',
			status: DeviceProfileStatus.PUBLISHED,
			restrictions: 'old restrictions',
			components: [
				{ ...expectedComponent, label: 'old label' },
			],
		} as DeviceProfile
		const original = { ...deviceProfile, components: [{ ...deviceProfile.components[0] }] }

		const result = cleanupForCreate(deviceProfile)
		expect(result).toStrictEqual(expectedResult)

		// Make sure original was left alone
		expect(result).not.toBe(deviceProfile)
		expect(deviceProfile).toStrictEqual(original)
	})

	it('handles non-existent components', () => {
		const expectedResult = {
			name: 'profile name',
			metadata: { field: 'value' },
			components: undefined,
		}
		const deviceProfile = {
			...expectedResult,
			id: 'old-profile-id',
			status: DeviceProfileStatus.PUBLISHED,
			restrictions: 'old restrictions',
		} as unknown as DeviceProfile

		expect(cleanupForCreate(deviceProfile)).toStrictEqual(expectedResult)
	})
})

describe('convertToUpdateRequest', () => {
	it('removes appropriate fields', () => {
		const expectedComponent = { id: 'component-id' }
		const expectedResult = {
			metadata: { field: 'value' },
			components: [expectedComponent],
		}
		const deviceProfile = {
			...expectedResult,
			id: 'old-profile-id',
			status: DeviceProfileStatus.PUBLISHED,
			name: 'old profile name',
			restrictions: 'old restrictions',
			components: [
				{ ...expectedComponent, label: 'old label' },
			],
		} as DeviceProfile
		const original = { ...deviceProfile, components: [{ ...deviceProfile.components[0] }] }

		const result = cleanupForUpdate(deviceProfile)
		expect(result).toStrictEqual(expectedResult)

		// Make sure original was left alone
		expect(result).not.toBe(deviceProfile)
		expect(deviceProfile).toStrictEqual(original)
	})
})
