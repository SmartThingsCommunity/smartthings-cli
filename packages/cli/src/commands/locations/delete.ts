import { APICommand } from '@smartthings/cli-lib'

import { chooseLocation } from '../locations'


export default class LocationsDeleteCommand extends APICommand {
	static description = 'delete a location'

	static flags = APICommand.flags

	static args = [{
		name: 'id',
		description: 'location id',
	}]

	static examples = [
		'$ smartthings locations:delete                 # choose the location to delete from a list',
		'$ smartthings locations:delete my-location-id  # delete the location with the specified id',
	]

	async run(): Promise<void> {
		const { args, argv, flags } = await this.parse(LocationsDeleteCommand)
		await super.setup(args, argv, flags)

		const id = await chooseLocation(this, args.id)
		await this.client.locations.delete(id)
		this.log(`Location ${id} deleted.`)
	}
}
