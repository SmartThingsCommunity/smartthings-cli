import { DevicePreference } from '@smartthings/core-sdk'
import { APIOrganizationCommand, inputAndOutputItem } from '@smartthings/cli-lib'
import { chooseDevicePreference, tableFieldDefinitions } from '../../lib/commands/devicepreferences-util.js'


export default class DevicePreferencesUpdateCommand extends APIOrganizationCommand<typeof DevicePreferencesUpdateCommand.flags> {
	static description = 'update a device preference' +
		this.apiDocsURL('updatePreferenceById')

	static flags = {
		...APIOrganizationCommand.flags,
		...inputAndOutputItem.flags,
	}

	static args = [{
		name: 'id',
		description: 'the device preference id',
	}]

	static examples = [
		{
			description: 'select a device preference from a list and update it with data from dp.json',
			command: 'smartthings devicepreferences:update -i dp.json',
		},
		{
			description: 'update specified device preference with data from dp.yaml',
			command: 'smartthings devicepreferences:update -i dp.yaml motionSensitivity',
		},
	]

	async run(): Promise<void> {
		const id = await chooseDevicePreference(this, this.args.id)
		await inputAndOutputItem<DevicePreference, DevicePreference>(this, { tableFieldDefinitions },
			(_, devicePreference) => this.client.devicePreferences.update(id, devicePreference))
	}
}
