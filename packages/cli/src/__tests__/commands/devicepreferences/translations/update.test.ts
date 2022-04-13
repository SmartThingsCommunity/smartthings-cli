import { inputAndOutputItem } from '@smartthings/cli-lib'
import { DevicePreferencesEndpoint, PreferenceLocalization } from '@smartthings/core-sdk'
import DevicePreferencesTranslationsUpdateCommand from '../../../../commands/devicepreferences/translations/update'
import { chooseDevicePreference } from '../../../../lib/commands/devicepreferences/devicepreferences-util'
import { tableFieldDefinitions } from '../../../../lib/commands/devicepreferences/translations/translations-util'


jest.mock('../../../../lib/commands/devicepreferences/devicepreferences-util')


const MOCK_PREFERENCE_L10N = {} as PreferenceLocalization

describe('DevicePreferencesTranslationsUpdateCommand', () => {
	const mockChooseDevicePreference = jest.mocked(chooseDevicePreference)
	const mockInputAndOutputItem = jest.mocked(inputAndOutputItem)
	const updateTranslationsSpy = jest.spyOn(DevicePreferencesEndpoint.prototype, 'updateTranslations').mockImplementation()

	const preferenceId = 'preferenceId'

	beforeAll(() => {
		mockChooseDevicePreference.mockResolvedValue(preferenceId)
	})

	it('prompts user to choose device preference', async () => {
		await expect(DevicePreferencesTranslationsUpdateCommand.run([])).resolves.not.toThrow()

		expect(chooseDevicePreference).toBeCalledWith(
			expect.any(DevicePreferencesTranslationsUpdateCommand),
			undefined,
		)
	})

	it('calls inputOutput with correct config', async () => {
		await expect(DevicePreferencesTranslationsUpdateCommand.run([])).resolves.not.toThrow()

		expect(mockInputAndOutputItem).toBeCalledWith(
			expect.any(DevicePreferencesTranslationsUpdateCommand),
			expect.objectContaining({
				tableFieldDefinitions,
			}),
			expect.any(Function),
		)
	})

	it('calls correct endpoint to create translations', async () => {
		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, MOCK_PREFERENCE_L10N)
		})

		await expect(DevicePreferencesTranslationsUpdateCommand.run([])).resolves.not.toThrow()

		expect(updateTranslationsSpy).toBeCalledWith(preferenceId, MOCK_PREFERENCE_L10N)
	})
})
