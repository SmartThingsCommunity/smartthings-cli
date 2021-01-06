import { flags } from '@oclif/command'
import { LocationItem, Room } from '@smartthings/core-sdk'

import { APICommand, outputListing } from '@smartthings/cli-lib'


export const tableFieldDefinitions = ['name', 'locationId', 'roomId']

export async function getRoomsByLocation(this: APICommand, locationId?: string): Promise<RoomWithLocation[]> {
	let locations: LocationItem[] = []
	if (locationId) {
		this.log(`location specified: ${locationId}`)
		locations = [await this.client.locations.get(locationId)]
	} else {
		locations = await this.client.locations.list()
	}

	if (!locations || locations.length == 0) {
		throw Error('could not find any locations for your account. Perhaps ' +
			"you haven't created any locations yet.")
	}

	let rooms: RoomWithLocation[] = []
	for (const location of locations) {
		const locationRooms = await this.client.rooms.list(location.locationId)
		rooms = rooms.concat(locationRooms.map(room => { return { ...room, locationName: location.name } }))
	}
	return rooms
}

export type RoomWithLocation = Room & {
	locationName?: string
}

export default class RoomsCommand extends APICommand {
	static description = 'get a specific room'

	static flags = {
		...APICommand.flags,
		locationId: flags.string({
			char: 'l',
			description: 'a specific locationId to query',
		}),
		...outputListing.flags,
	}

	static args = [{
		name: 'idOrIndex',
		description: 'room UUID or index',
	}]

	static aliases = ['rooms']

	primaryKeyName = 'roomId'
	sortKeyName = 'name'

	protected getRoomsByLocation = getRoomsByLocation

	listTableFieldDefinitions = tableFieldDefinitions
	tableFieldDefinitions = tableFieldDefinitions

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(RoomsCommand)
		await super.setup(args, argv, flags)

		const roomsPromise = this.getRoomsByLocation(flags.locationId)
		await outputListing(this,
			args.idOrIndex,
			() => roomsPromise,
			async id => {
				const room = (await roomsPromise).find(room => room.roomId === id)
				if (!room) {
					throw Error(`could not find room with id ${id}`)
				}
				return this.client.rooms.get(id, room.locationId)
			})
	}
}
