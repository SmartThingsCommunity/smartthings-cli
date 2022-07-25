import { Flags } from '@oclif/core'
import { APICommand, ListingOutputConfig, outputListing, withLocations } from '@smartthings/cli-lib'
import { Room } from '@smartthings/core-sdk'
import { getRoomsByLocation, RoomWithLocation, tableFieldDefinitions } from '../../lib/commands/locations/rooms-util'


export default class RoomsCommand extends APICommand<typeof RoomsCommand.flags> {
	static description = 'list rooms or get information for a specific room'

	static flags = {
		...APICommand.flags,
		// eslint-disable-next-line @typescript-eslint/naming-convention
		'location-id': Flags.string({
			char: 'l',
			description: 'a specific location to query',
		}),
		verbose: Flags.boolean({
			description: 'include location name in output',
			char: 'v',
		}),
		...outputListing.flags,
	}

	static args = [{
		name: 'idOrIndex',
		description: 'room UUID or index',
	}]

	static aliases = ['rooms']

	async run(): Promise<void> {
		const config: ListingOutputConfig<Room, RoomWithLocation> = {
			primaryKeyName: 'roomId',
			sortKeyName: 'name',
			listTableFieldDefinitions: tableFieldDefinitions,
			tableFieldDefinitions,
		}
		if (this.flags.verbose) {
			config.listTableFieldDefinitions?.push('location')
		}
		const rooms = await getRoomsByLocation(this.client, this.flags['location-id'])
		await outputListing(this, config, this.args.idOrIndex,
			async () => {
				if (this.flags.verbose) {
					return await withLocations(this.client, rooms)
				}
				return rooms
			},
			async id => {
				const room = rooms.find(room => room.roomId === id)
				if (!room) {
					throw Error(`could not find room with id ${id}`)
				}
				const chosenRoom = await this.client.rooms.get(id, room.locationId)
				if (this.flags.verbose) {
					return await withLocations(this.client, [chosenRoom]) as Room
				}
				return chosenRoom
			})
	}
}
