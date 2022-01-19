import { APICommand, ListDataFunction, ListingOutputConfig, LookupDataFunction, outputListing, SmartThingsCommandInterface } from '@smartthings/cli-lib'
import { DevicePreferencesEndpoint, LocaleReference, PreferenceLocalization } from '@smartthings/core-sdk'
import DevicePreferencesTranslationsCommand from '../../../commands/devicepreferences/translations'
import { chooseDevicePreference } from '../../../lib/commands/devicepreferences/devicepreferences-util'
import { tableFieldDefinitions } from '../../../lib/commands/devicepreferences/translations/translations-util'


jest.mock('../../../lib/commands/devicepreferences/devicepreferences-util')

jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		outputListing: jest.fn(),
	}
})

describe('DevicePreferencesTranslationsCommand', () => {
	const mockChoosePreference = chooseDevicePreference as jest.Mock<Promise<string>, [APICommand, string | undefined]>
	const mockOutputListing = outputListing as unknown as
		jest.Mock<Promise<void>, [
			SmartThingsCommandInterface,
			ListingOutputConfig<PreferenceLocalization, LocaleReference>,
			string | undefined,
			ListDataFunction<LocaleReference>,
			LookupDataFunction<string, PreferenceLocalization>
		]>
	const getTranslationsSpy = jest.spyOn(DevicePreferencesEndpoint.prototype, 'getTranslations').mockImplementation()
	const listTranslationsSpy = jest.spyOn(DevicePreferencesEndpoint.prototype, 'listTranslations').mockImplementation()

	const preferenceId = 'preferenceId'
	const localeTag = 'localeTag'

	beforeAll(() => {
		mockChoosePreference.mockResolvedValue(preferenceId)
	})

	afterEach(() => {
		jest.clearAllMocks()
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
