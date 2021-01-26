import { APICommand, selectAndActOn } from '@smartthings/cli-lib'


export default class LocationsDeleteCommand extends APICommand {
	static description = 'delete a location'

	static flags = APICommand.flags

	static args = [{
		name: 'id',
		description: 'location id',
	}]

	primaryKeyName = 'locationId'
	sortKeyName = 'name'

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(LocationsDeleteCommand)
		await super.setup(args, argv, flags)

		await selectAndActOn(this, args.id,
			async () => await this.client.locations.list(),
			async id => { await this.client.locations.delete(id) },
			'location {{id}} deleted')
	}
}
