import { flags } from '@oclif/command'
import { APICommand, ListingOutputConfig, outputListing } from '@smartthings/cli-lib'
import { Room } from '@smartthings/core-sdk'
import { getRoomsByLocation, RoomWithLocation, tableFieldDefinitions } from '../../lib/commands/locations/rooms/rooms-util'


export default class RoomsCommand extends APICommand {
	static description = 'list rooms or get information for a specific room'

	static flags = {
		...APICommand.flags,
		'location-id': flags.string({
			char: 'l',
			description: 'a specific location to query',
		}),
		...outputListing.flags,
	}

	static args = [{
		name: 'idOrIndex',
		description: 'room UUID or index',
	}]

	static aliases = ['rooms']

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(RoomsCommand)
		await super.setup(args, argv, flags)

		const config: ListingOutputConfig<Room, RoomWithLocation> = {
			primaryKeyName: 'roomId',
			sortKeyName: 'name',
			listTableFieldDefinitions: tableFieldDefinitions,
			tableFieldDefinitions,
		}
		const rooms = await getRoomsByLocation(this.client, flags['location-id'])
		await outputListing(this, config, args.idOrIndex,
			async () => rooms,
			async id => {
				const room = rooms.find(room => room.roomId === id)
				if (!room) {
					throw Error(`could not find room with id ${id}`)
				}
				return this.client.rooms.get(id, room.locationId)
			})
	}
}
