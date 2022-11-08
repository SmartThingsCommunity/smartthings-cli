import { DevicePreference } from '@smartthings/core-sdk'
import { APIOrganizationCommand, inputAndOutputItem } from '@smartthings/cli-lib'
import { chooseDevicePreference, tableFieldDefinitions } from '../../lib/commands/devicepreferences-util'


export default class DevicePreferencesUpdateCommand extends APIOrganizationCommand<typeof DevicePreferencesUpdateCommand.flags> {
	static description = 'update a device preference'

	static flags = {
		...APIOrganizationCommand.flags,
		...inputAndOutputItem.flags,
	}

	static args = [{
		name: 'id',
		description: 'the device preference id',
	}]

	static examples = [
		'$ smartthings devicepreferences:update -i dp.json                   # update a device preference with data from dp.json, select which preference from a list',
		'$ smartthings devicepreferences:update -i dp.yaml my-preference-id  # update device preference my-preference-id with data from dp.yaml',
	]

	async run(): Promise<void> {
		const id = await chooseDevicePreference(this, this.args.id)
		await inputAndOutputItem<DevicePreference, DevicePreference>(this, { tableFieldDefinitions },
			(_, devicePreference) => this.client.devicePreferences.update(id, devicePreference))
	}
}
