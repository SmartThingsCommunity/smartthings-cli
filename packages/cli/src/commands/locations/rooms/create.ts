import { Flags } from '@oclif/core'
import { Room, RoomRequest } from '@smartthings/core-sdk'
import { APICommand, CommonOutputProducer, inputAndOutputItem } from '@smartthings/cli-lib'
import { chooseLocation } from '../../locations'
import { tableFieldDefinitions } from '../../../lib/commands/locations/rooms-util'


export default class RoomsCreateCommand extends APICommand<typeof RoomsCreateCommand.flags> {
	static description = 'create a room'

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
		location: Flags.string({
			char: 'l',
			description: 'a specific location to query',
			helpValue: '<UUID>',
		}),
	}

	async run(): Promise<void> {
		const locationId = await chooseLocation(this, this.flags.location)
		const config: CommonOutputProducer<Room> = { tableFieldDefinitions }
		await inputAndOutputItem<RoomRequest, Room>(this, config,
			(_, room) => this.client.rooms.create(room, locationId))
	}
}
