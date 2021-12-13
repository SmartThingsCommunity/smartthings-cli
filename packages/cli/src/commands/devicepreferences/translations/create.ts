import { APICommand, inputAndOutputItem } from '@smartthings/cli-lib'
import { PreferenceLocalization } from '@smartthings/core-sdk'
import { chooseDevicePreference } from '../../../lib/commands/devicepreferences/devicepreferences-util'
import { tableFieldDefinitions } from '../../../lib/commands/devicepreferences/translations/translations-util'


export default class DevicePreferencesTranslationsCreateCommand extends APICommand {
	static description = 'create a device preference translation'

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
	}

	static args = [{
		name: 'preferenceId',
		description: 'device preference id or index',
	}]

	static examples = [
		'$ smartthings devicepreferences:translations:create -i preferenceTranslation.json',
	]

	async init(): Promise<void> {
		await super.init()

		const { args, argv, flags } = this.parse(DevicePreferencesTranslationsCreateCommand)
		await super.setup(args, argv, flags)
	}

	async run(): Promise<void> {
		const preferenceId = await chooseDevicePreference(this, this.args.preferenceId)

		await inputAndOutputItem<PreferenceLocalization, PreferenceLocalization>(this, { tableFieldDefinitions },
			(_, translation) => this.client.devicePreferences.createTranslations(preferenceId, translation))
	}
}
