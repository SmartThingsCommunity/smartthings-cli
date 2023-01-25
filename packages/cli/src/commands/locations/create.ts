import { LocationCreate } from '@smartthings/core-sdk'

import { APICommand, inputAndOutputItem } from '@smartthings/cli-lib'

import { tableFieldDefinitions } from '../locations'


export default class LocationsCreateCommand extends APICommand<typeof LocationsCreateCommand.flags> {
	static description = 'create a Location for a user' +
		this.apiDocsURL('createLocation')

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
	}

	async run(): Promise<void> {
		await inputAndOutputItem(this, { tableFieldDefinitions },
			(_, input: LocationCreate) => this.client.locations.create(input))
	}
}
