import { APICommand } from '@smartthings/cli-lib'

import { chooseLocation } from '../locations'


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

		const id = await chooseLocation(this, args.id)
		await this.client.locations.delete(id)
		this.log(`Location ${id} deleted.`)
	}
}
