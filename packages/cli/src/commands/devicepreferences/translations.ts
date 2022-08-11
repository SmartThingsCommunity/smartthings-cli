import { APIOrganizationCommand, OutputItemOrListConfig, outputItemOrList } from '@smartthings/cli-lib'
import { LocaleReference, PreferenceLocalization } from '@smartthings/core-sdk'
import { chooseDevicePreference } from '../../lib/commands/devicepreferences-util'
import { tableFieldDefinitions } from '../../lib/commands/devicepreferences/translations-util'


export default class DevicePreferencesTranslationsCommand extends APIOrganizationCommand<typeof DevicePreferencesTranslationsCommand.flags> {
	static description = 'get translated device preference values in a desired locale'

	static flags = {
		...APIOrganizationCommand.flags,
		...outputItemOrList.flags,
	}

	static args = [
		{ name: 'preferenceId', description: 'device preference id or index' },
		{ name: 'tag', description: 'the locale tag' },
	]

	static examples = [
		`# let command prompt to choose device preference and list locales
$ smartthings devicepreferences:translations
`,
		`# specify device preference ID and list locales
$ smartthings devicepreferences:translations motionSensitivity
`,
		`# specify device preference ID and locale to get translated device preference values
$ smartthings devicepreferences:translations motionSensitivity ko`,
	]

	async run(): Promise<void> {
		const preferenceId = await chooseDevicePreference(this, this.args.preferenceId)

		const config: OutputItemOrListConfig<PreferenceLocalization, LocaleReference> = {
			primaryKeyName: 'tag',
			sortKeyName: 'tag',
			listTableFieldDefinitions: ['tag'],
			tableFieldDefinitions,
		}

		await outputItemOrList<PreferenceLocalization, LocaleReference>(this, config, this.args.tag,
			() => this.client.devicePreferences.listTranslations(preferenceId),
			tag => this.client.devicePreferences.getTranslations(preferenceId, tag))
	}
}
