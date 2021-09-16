import {APIOrganizationCommand, outputItem} from '@smartthings/cli-lib'
import { PreferenceLocalization } from '@smartthings/core-sdk'
import { chooseDevicePreference } from '../../lib/commands/devicepreferences/devicepreferences-util'
import { tableFieldDefinitions } from '../../lib/commands/devicepreferences/translations/translations-util'


export default class DevicePreferencesTranslationsCommand extends APIOrganizationCommand {
	static description = 'get translated device preference values in a desired locale'

	static flags = {
		...APIOrganizationCommand.flags,
		...outputItem.flags,
	}

	static args = [
		{ name: 'preferenceId', description: 'device preference id or index' },
		{ name: 'tag', description: 'the locale tag', default: 'en' },
	]

	static examples = [`
# let command prompt to choose device preference
$ smartthings devicepreferences:translations
`,
	`# specify device preference ID and use default locale tag (en)
$ smartthings devicepreferences:translations motionSensitivity
`,
	`# specify device preference ID and locale
$ smartthings devicepreferences:translations motionSensitivity ko`]

	async init(): Promise<void> {
		await super.init()

		const { args, argv, flags } = this.parse(DevicePreferencesTranslationsCommand)
		await super.setup(args, argv, flags)
	}

	async run(): Promise<void> {
		const preferenceId = await chooseDevicePreference(this, this.args.preferenceId)

		await outputItem<PreferenceLocalization>(this, { tableFieldDefinitions },
			() => this.client.devicePreferences.getTranslations(preferenceId, this.args.tag))
	}
}
