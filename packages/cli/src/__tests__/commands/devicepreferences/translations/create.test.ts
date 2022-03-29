import { inputAndOutputItem } from '@smartthings/cli-lib'
import { DevicePreferencesEndpoint, PreferenceLocalization } from '@smartthings/core-sdk'
import DevicePreferencesTranslationsCreateCommand from '../../../../commands/devicepreferences/translations/create'
import { chooseDevicePreference } from '../../../../lib/commands/devicepreferences/devicepreferences-util'
import { tableFieldDefinitions } from '../../../../lib/commands/devicepreferences/translations/translations-util'


jest.mock('../../../../lib/commands/devicepreferences/devicepreferences-util')

jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		inputAndOutputItem: jest.fn(),
	}
})

const MOCK_PREFERENCE_L10N = {} as PreferenceLocalization

describe('DevicePreferencesTranslationsCreateCommand', () => {
	const mockChooseDevicePreference = jest.mocked(chooseDevicePreference)
	const mockInputAndOutputItem = jest.mocked(inputAndOutputItem)
	const createTranslationsSpy = jest.spyOn(DevicePreferencesEndpoint.prototype, 'createTranslations').mockImplementation()

	const preferenceId = 'preferenceId'

	beforeAll(() => {
		mockChooseDevicePreference.mockResolvedValue(preferenceId)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('prompts user to choose device preference', async () => {
		await expect(DevicePreferencesTranslationsCreateCommand.run([])).resolves.not.toThrow()

		expect(chooseDevicePreference).toBeCalledWith(
			expect.any(DevicePreferencesTranslationsCreateCommand),
			undefined,
		)
	})

	it('calls inputOutput with correct config', async () => {
		await expect(DevicePreferencesTranslationsCreateCommand.run([])).resolves.not.toThrow()

		expect(mockInputAndOutputItem).toBeCalledWith(
			expect.any(DevicePreferencesTranslationsCreateCommand),
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

		await expect(DevicePreferencesTranslationsCreateCommand.run([])).resolves.not.toThrow()

		expect(createTranslationsSpy).toBeCalledWith(preferenceId, MOCK_PREFERENCE_L10N)
	})
})
