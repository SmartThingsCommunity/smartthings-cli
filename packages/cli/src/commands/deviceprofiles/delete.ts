import { APIOrganizationCommand } from '@smartthings/cli-lib'

import { chooseDeviceProfile } from '../deviceprofiles'


export default class DeviceProfileDeleteCommand extends APIOrganizationCommand {
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

	static aliases = ['device-profiles:delete']

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceProfileDeleteCommand)
		await super.setup(args, argv, flags)

		const id = await chooseDeviceProfile(this, args.id)
		await this.client.deviceProfiles.delete(id)
		this.log(`Device profile ${id} deleted.`)
	}
}
