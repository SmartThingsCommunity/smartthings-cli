import { flags } from '@oclif/command'

import { Room, RoomRequest } from '@smartthings/core-sdk'

import { APICommand, inputAndOutputItem } from '@smartthings/cli-lib'

import { chooseRoom, tableFieldDefinitions } from '../rooms'


export default class RoomsUpdateCommand extends APICommand {
	static description = 'update a room'

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
		'location-id': flags.string({
			char: 'l',
			description: 'a specific location to query',
		}),
	}

	static args = [{
		name: 'id',
		description: 'room UUID',
	}]

	static aliases = ['rooms:update']

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(RoomsUpdateCommand)
		await super.setup(args, argv, flags)

		const [roomId, locationId] = await chooseRoom(this, flags['location-id'], args.id)
		await inputAndOutputItem<RoomRequest, Room>(this, { tableFieldDefinitions },
			(_, data) => this.client.rooms.update(roomId, data, locationId))
	}
}
