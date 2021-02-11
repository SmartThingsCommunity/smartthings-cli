import { APICommand, selectFromList } from '@smartthings/cli-lib'


export default class DeviceProfileDeleteCommand extends APICommand {
	static description = 'delete a device profile'

	static flags = APICommand.flags

	static args = [{
		name: 'id',
		description: 'Device profile UUID or number in the list',
	}]

	static examples = [
		'$ smartthings deviceprofiles:delete 63b8c91e-9686-4c43-9afb-fbd9f77e3bb0  # delete profile with this UUID',
		'$ smartthings deviceprofiles:delete 5                                     # delete the 5th profile in the list',
	]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(DeviceProfileDeleteCommand)
		await super.setup(args, argv, flags)

		const config = {
			primaryKeyName: 'id',
			sortKeyName: 'name',
			listTableFieldDefinitions: ['name', 'status', 'id'],
		}
		const id = await selectFromList(this, config, args.id,
			() => this.client.deviceProfiles.list(),
			'Select a device profile to delete.')
		await this.client.deviceProfiles.delete(id)
		this.log(`Device profile ${id} deleted.`)
	}
}
