import { APICommand, selectFromList } from '@smartthings/cli-lib'


export default class LocationsDeleteCommand extends APICommand {
	static description = 'delete a location'

	static flags = APICommand.flags

	static args = [{
		name: 'id',
		description: 'location id',
	}]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(LocationsDeleteCommand)
		await super.setup(args, argv, flags)

		const config = {
			primaryKeyName: 'locationId',
			sortKeyName: 'name',
		}
		const id = await selectFromList(this, config, args.id,
			async () => await this.client.locations.list(),
			'Select location to delete.')
		await this.client.locations.delete(id)
		this.log(`Location ${id} deleted.`)
	}
}
