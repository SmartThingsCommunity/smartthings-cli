import { APIOrganizationCommand } from '@smartthings/cli-lib'

import { chooseDeviceProfile } from '../../lib/commands/deviceprofiles-util'


export default class DeviceProfileDeleteCommand extends APIOrganizationCommand<typeof DeviceProfileDeleteCommand.flags> {
	static description = 'delete a device profile'

	static flags = APIOrganizationCommand.flags

	static args = [{
		name: 'id',
		description: 'Device profile UUID or number in the list',
	}]

	static examples = [
		'$ smartthings deviceprofiles:delete 63b8c91e-9686-4c43-9afb-fbd9f77e3bb0  # delete profile with this UUID',
		'$ smartthings deviceprofiles:delete 5                                     # delete the 5th profile in the list',
	]

	async run(): Promise<void> {
		const id = await chooseDeviceProfile(this, this.args.id)
		await this.client.deviceProfiles.delete(id)
		this.log(`Device profile ${id} deleted.`)
	}
}
