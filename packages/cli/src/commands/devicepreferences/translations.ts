import { APIOrganizationCommand, ListingOutputConfig, outputListing } from '@smartthings/cli-lib'
import { LocaleReference, PreferenceLocalization } from '@smartthings/core-sdk'
import { chooseDevicePreference } from '../../lib/commands/devicepreferences/devicepreferences-util'
import { tableFieldDefinitions } from '../../lib/commands/devicepreferences/translations/translations-util'


export default class DevicePreferencesTranslationsCommand extends APIOrganizationCommand {
	static description = 'get translated device preference values in a desired locale'

	static flags = {
		...APIOrganizationCommand.flags,
		...outputListing.flags,
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

	async init(): Promise<void> {
		await super.init()

		const { args, argv, flags } = await this.parse(DevicePreferencesTranslationsCommand)
		await super.setup(args, argv, flags)
	}

	async run(): Promise<void> {
		const preferenceId = await chooseDevicePreference(this, this.args.preferenceId)

		const config: ListingOutputConfig<PreferenceLocalization, LocaleReference> = {
			primaryKeyName: 'tag',
			sortKeyName: 'tag',
			listTableFieldDefinitions: ['tag'],
			tableFieldDefinitions,
		}

		await outputListing<PreferenceLocalization, LocaleReference>(this, config, this.args.tag,
			() => this.client.devicePreferences.listTranslations(preferenceId),
			tag => this.client.devicePreferences.getTranslations(preferenceId, tag))
	}
}
