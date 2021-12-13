import { APICommand, GetDataFunction, outputItem, SmartThingsCommandInterface, TableCommonOutputProducer } from '@smartthings/cli-lib'
import { DevicePreferencesEndpoint, PreferenceLocalization } from '@smartthings/core-sdk'
import DevicePreferencesTranslationsCommand from '../../../commands/devicepreferences/translations'
import { chooseDevicePreference } from '../../../lib/commands/devicepreferences/devicepreferences-util'
import { tableFieldDefinitions } from '../../../lib/commands/devicepreferences/translations/translations-util'


jest.mock('../../../lib/commands/devicepreferences/devicepreferences-util')

jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		outputItem: jest.fn(),
	}
})

describe('DevicePreferencesTranslationsCommand', () => {
	const mockChoosePreference = chooseDevicePreference as jest.Mock<Promise<string>, [APICommand, string | undefined]>
	const mockOutputItem = outputItem as unknown as
		jest.Mock<Promise<PreferenceLocalization>, [
			SmartThingsCommandInterface,
			TableCommonOutputProducer<PreferenceLocalization>,
			GetDataFunction<PreferenceLocalization>
		]>
	const getTranslationsSpy = jest.spyOn(DevicePreferencesEndpoint.prototype, 'getTranslations').mockImplementation()

	const preferenceId = 'preferenceId'
	const localeTag = 'localeTag'

	beforeAll(() => {
		mockChoosePreference.mockResolvedValue(preferenceId)
		mockOutputItem.mockImplementation(async (_command, _config, getFunction) => {
			return getFunction()
		})
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('prompts user to choose device preference', async () => {
		await expect(DevicePreferencesTranslationsCommand.run()).resolves.not.toThrow()

		expect(chooseDevicePreference).toBeCalledWith(
			expect.any(DevicePreferencesTranslationsCommand),
			undefined,
		)
	})

	it('calls outputItem with correct config', async () => {
		await expect(DevicePreferencesTranslationsCommand.run([preferenceId, localeTag])).resolves.not.toThrow()

		expect(chooseDevicePreference).toBeCalledWith(
			expect.any(DevicePreferencesTranslationsCommand),
			preferenceId,
		)

		expect(mockOutputItem).toBeCalledWith(
			expect.any(DevicePreferencesTranslationsCommand),
			expect.objectContaining({
				tableFieldDefinitions,
			}),
			expect.any(Function),
		)
	})

	it('calls correct endpoint to get translations', async () => {
		await expect(DevicePreferencesTranslationsCommand.run([preferenceId, localeTag])).resolves.not.toThrow()

		expect(getTranslationsSpy).toBeCalledWith(preferenceId, localeTag)
	})

	it('uses default locale tag when not specified', async () => {
		await expect(DevicePreferencesTranslationsCommand.run([preferenceId])).resolves.not.toThrow()

		expect(getTranslationsSpy).toBeCalledWith(preferenceId, 'en')
	})
})
