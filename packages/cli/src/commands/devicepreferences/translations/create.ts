import { APIOrganizationCommand, inputAndOutputItem } from '@smartthings/cli-lib'
import { PreferenceLocalization } from '@smartthings/core-sdk'
import { chooseDevicePreference } from '../../../lib/commands/devicepreferences-util.js'
import { tableFieldDefinitions } from '../../../lib/commands/devicepreferences/translations-util.js'


export default class DevicePreferencesTranslationsCreateCommand extends APIOrganizationCommand<typeof DevicePreferencesTranslationsCreateCommand.flags> {
	static description = 'create a device preference translation'

	static flags = {
		...APIOrganizationCommand.flags,
		...inputAndOutputItem.flags,
	}

	static args = [{
		name: 'preferenceId',
		description: 'device preference id or index',
	}]

	static examples = [
		{
			description: 'create a device preference translation as defined in the file preferenceTranslation.json',
			command: 'smartthings devicepreferences:translations:create -i preferenceTranslation.json',
		},
	]

	async run(): Promise<void> {
		const preferenceId = await chooseDevicePreference(this, this.args.preferenceId)

		await inputAndOutputItem<PreferenceLocalization, PreferenceLocalization>(this, { tableFieldDefinitions },
			(_, translation) => this.client.devicePreferences.createTranslations(preferenceId, translation))
	}
}
