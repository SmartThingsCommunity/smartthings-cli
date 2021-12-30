import { Flags } from '@oclif/core'
import { Room, RoomRequest } from '@smartthings/core-sdk'
import { APICommand, CommonOutputProducer, inputAndOutputItem } from '@smartthings/cli-lib'
import { chooseLocation } from '../../locations'
import { tableFieldDefinitions } from '../../../lib/commands/locations/rooms/rooms-util'


export default class RoomsCreateCommand extends APICommand {
	static description = 'create a room'

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
		'location-id': Flags.string({
			char: 'l',
			description: 'a specific location to query',
		}),
	}

	static aliases = ['rooms:create']

	async run(): Promise<void> {
		const { args, argv, flags } = await this.parse(RoomsCreateCommand)
		await super.setup(args, argv, flags)

		const locationId = await chooseLocation(this, flags['location-id'])
		const config: CommonOutputProducer<Room> = { tableFieldDefinitions }
		await inputAndOutputItem<RoomRequest, Room>(this, config,
			(_, room) => this.client.rooms.create(room, locationId))
	}
}
