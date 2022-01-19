import { ActionFunction, APICommand, inputAndOutputItem, SmartThingsCommandInterface, TableCommonOutputProducer } from '@smartthings/cli-lib'
import { DevicePreferencesEndpoint, PreferenceLocalization } from '@smartthings/core-sdk'
import DevicePreferencesTranslationsUpdateCommand from '../../../../commands/devicepreferences/translations/update'
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

describe('DevicePreferencesTranslationsUpdateCommand', () => {
	const mockChoosePreference = chooseDevicePreference as jest.Mock<Promise<string>, [APICommand, string | undefined]>
	const mockInputOutput = inputAndOutputItem as unknown as jest.Mock<Promise<PreferenceLocalization>, [
		SmartThingsCommandInterface,
		TableCommonOutputProducer<PreferenceLocalization>,
		ActionFunction<void, PreferenceLocalization, PreferenceLocalization>
	]>
	const updateTranslationsSpy = jest.spyOn(DevicePreferencesEndpoint.prototype, 'updateTranslations').mockImplementation()

	const preferenceId = 'preferenceId'

	beforeAll(() => {
		mockChoosePreference.mockResolvedValue(preferenceId)
	})

	afterEach(() => {
		jest.clearAllMocks()
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

		expect(mockInputOutput).toBeCalledWith(
			expect.any(DevicePreferencesTranslationsUpdateCommand),
			expect.objectContaining({
				tableFieldDefinitions,
			}),
			expect.any(Function),
		)
	})

	it('calls correct endpoint to create translations', async () => {
		mockInputOutput.mockImplementationOnce(async (_command, _config, actionFunction) => {
			return actionFunction(undefined, MOCK_PREFERENCE_L10N)
		})

		await expect(DevicePreferencesTranslationsUpdateCommand.run([])).resolves.not.toThrow()

		expect(updateTranslationsSpy).toBeCalledWith(preferenceId, MOCK_PREFERENCE_L10N)
	})
})
