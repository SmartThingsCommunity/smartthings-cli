import { APICommand } from '@smartthings/cli-lib'

import { chooseLocation } from '../locations'


export default class LocationsDeleteCommand extends APICommand<typeof LocationsDeleteCommand.flags> {
	static description = 'delete a location' +
		this.apiDocsURL('deleteLocation')

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
		const id = await chooseLocation(this, this.args.id)
		await this.client.locations.delete(id)
		this.log(`Location ${id} deleted.`)
	}
}
