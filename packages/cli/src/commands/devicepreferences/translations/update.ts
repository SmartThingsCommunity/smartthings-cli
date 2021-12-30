import { APIOrganizationCommand, inputAndOutputItem } from '@smartthings/cli-lib'
import { PreferenceLocalization } from '@smartthings/core-sdk'
import { chooseDevicePreference } from '../../../lib/commands/devicepreferences/devicepreferences-util'
import { tableFieldDefinitions } from '../../../lib/commands/devicepreferences/translations/translations-util'


export default class DevicePreferencesTranslationsUpdateCommand extends APIOrganizationCommand {
	static description = 'update a device preference translation'

	static flags = {
		...APIOrganizationCommand.flags,
		...inputAndOutputItem.flags,
	}

	static args = [{
		name: 'preferenceId',
		description: 'device preference id or index',
	}]

	static examples = [
		'$ smartthings devicepreferences:translations:update -i preferenceTranslation.json',
	]

	async init(): Promise<void> {
		await super.init()

		const { args, argv, flags } = await this.parse(DevicePreferencesTranslationsUpdateCommand)
		await super.setup(args, argv, flags)
	}

	async run(): Promise<void> {
		const preferenceId = await chooseDevicePreference(this, this.args.preferenceId)

		await inputAndOutputItem<PreferenceLocalization, PreferenceLocalization>(this, { tableFieldDefinitions },
			(_, translation) => this.client.devicePreferences.updateTranslations(preferenceId, translation))
	}
}
