import { flags } from '@oclif/command'

import { Room, RoomRequest } from '@smartthings/core-sdk'

import { APICommand, inputAndOutputItem } from '@smartthings/cli-lib'

import { chooseLocation } from '../../locations'
import { tableFieldDefinitions } from '../rooms'


export default class RoomsCreateCommand extends APICommand {
	static description = 'create a room'

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
		'location-id': flags.string({
			char: 'l',
			description: 'a specific location to query',
		}),
	}

	static aliases = ['rooms:create']

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(RoomsCreateCommand)
		await super.setup(args, argv, flags)

		const locationId = await chooseLocation(this, flags['location-id'])

		await inputAndOutputItem<RoomRequest, Room>(this, { tableFieldDefinitions },
			(_, location) => this.client.rooms.create(location, locationId))
	}
}
