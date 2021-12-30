import { LocationCreate } from '@smartthings/core-sdk'

import { APICommand, inputAndOutputItem } from '@smartthings/cli-lib'

import { tableFieldDefinitions } from '../locations'


export default class LocationsCreateCommand extends APICommand {
	static description = 'create a Location for a user'

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
	}

	async run(): Promise<void> {
		const { args, argv, flags } = await this.parse(LocationsCreateCommand)
		await super.setup(args, argv, flags)

		await inputAndOutputItem(this, { tableFieldDefinitions },
			(_, input: LocationCreate) => this.client.locations.create(input))
	}
}
