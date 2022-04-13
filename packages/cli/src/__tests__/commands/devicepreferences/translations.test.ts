import { outputListing } from '@smartthings/cli-lib'
import { DevicePreferencesEndpoint } from '@smartthings/core-sdk'
import DevicePreferencesTranslationsCommand from '../../../commands/devicepreferences/translations'
import { chooseDevicePreference } from '../../../lib/commands/devicepreferences/devicepreferences-util'
import { tableFieldDefinitions } from '../../../lib/commands/devicepreferences/translations/translations-util'


jest.mock('../../../lib/commands/devicepreferences/devicepreferences-util')


describe('DevicePreferencesTranslationsCommand', () => {
	const mockChooseDevicePreference = jest.mocked(chooseDevicePreference)
	const mockOutputListing = jest.mocked(outputListing)
	const getTranslationsSpy = jest.spyOn(DevicePreferencesEndpoint.prototype, 'getTranslations').mockImplementation()
	const listTranslationsSpy = jest.spyOn(DevicePreferencesEndpoint.prototype, 'listTranslations').mockImplementation()

	const preferenceId = 'preferenceId'
	const localeTag = 'localeTag'

	beforeAll(() => {
		mockChooseDevicePreference.mockResolvedValue(preferenceId)
	})

	it('prompts user to choose device preference', async () => {
		await expect(DevicePreferencesTranslationsCommand.run([])).resolves.not.toThrow()

		expect(chooseDevicePreference).toBeCalledWith(
			expect.any(DevicePreferencesTranslationsCommand),
			undefined,
		)
	})

	it('calls outputListing with correct config', async () => {
		await expect(DevicePreferencesTranslationsCommand.run([preferenceId, localeTag])).resolves.not.toThrow()

		expect(chooseDevicePreference).toBeCalledWith(
			expect.any(DevicePreferencesTranslationsCommand),
			preferenceId,
		)

		expect(mockOutputListing).toBeCalledWith(
			expect.any(DevicePreferencesTranslationsCommand),
			expect.objectContaining({
				primaryKeyName: 'tag',
				sortKeyName: 'tag',
				listTableFieldDefinitions: ['tag'],
				tableFieldDefinitions,
			}),
			localeTag,
			expect.any(Function),
			expect.any(Function),
		)
	})

	it('calls correct endpoints to get translations', async () => {
		mockOutputListing.mockImplementationOnce(async (_command, _config, _tag, listFunction, getFunction) => {
			await listFunction()
			await getFunction(localeTag)
		})

		await expect(DevicePreferencesTranslationsCommand.run([preferenceId, localeTag])).resolves.not.toThrow()

		expect(listTranslationsSpy).toBeCalledWith(preferenceId)
		expect(getTranslationsSpy).toBeCalledWith(preferenceId, localeTag)
	})
})
