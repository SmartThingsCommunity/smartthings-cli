import { Flags } from '@oclif/core'
import { Room, RoomRequest } from '@smartthings/core-sdk'
import { APICommand, CommonOutputProducer, inputAndOutputItem } from '@smartthings/cli-lib'
import { chooseRoom, tableFieldDefinitions } from '../../../lib/commands/locations/rooms/rooms-util'


export default class RoomsUpdateCommand extends APICommand {
	static description = 'update a room'

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
		'location-id': Flags.string({
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
		const { args, argv, flags } = await this.parse(RoomsUpdateCommand)
		await super.setup(args, argv, flags)

		const [roomId, locationId] = await chooseRoom(this, flags['location-id'], args.id)
		const config: CommonOutputProducer<Room> = { tableFieldDefinitions }
		await inputAndOutputItem<RoomRequest, Room>(this, config,
			(_, data) => this.client.rooms.update(roomId, data, locationId))
	}
}
