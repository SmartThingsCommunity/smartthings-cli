import { flags } from '@oclif/command'
import { LocationItem, Room } from '@smartthings/core-sdk'

import { APICommand, ListingOutputAPICommand } from '@smartthings/cli-lib'


export function buildTableOutput(this: APICommand, data: Room): string {
	const table = this.newOutputTable()
	table.push(['Location Id', data.locationId ?? ''])
	table.push(['Room Id', data.roomId ?? ''])
	table.push(['Room Name', data.name ?? ''])
	return table.toString()
}

export async function getRoomsByLocation(this: APICommand, locationId?: string): Promise<RoomWithLocation[]> {
	let locations: LocationItem[] = []
	if (locationId) {
		this.log(`location specified: ${locationId}`)
		locations = [await this.client.locations.get(locationId)]
	} else {
		locations = await this.client.locations.list()
	}

	if (!locations || locations.length == 0) {
		throw Error('could not find any locations for you account. Perhaps ' +
			"you haven't created any locations yet.")
	}

	let rooms: RoomWithLocation[] = []
	for (const location of locations) {
		const locationRooms = await this.client.rooms.list(location.locationId)
		rooms = rooms.concat(locationRooms.map(room => { return { ...room, locationName: location.name } }))
	}
	return rooms
}

export type RoomWithLocation = Room & { locationName?: string }

export default class RoomsCommand extends ListingOutputAPICommand<Room, RoomWithLocation> {
	static description = 'get a specific room'

	static flags = {
		...ListingOutputAPICommand.flags,
		locationId: flags.string({
			char: 'l',
			description: 'a specific locationId to query',
		}),
	}

	static args = [{
		name: 'idOrIndex',
		description: 'the room id',
	}]

	static aliases = ['rooms']

	primaryKeyName = 'roomId'
	sortKeyName = 'name'

	protected buildObjectTableOutput = buildTableOutput
	protected getRoomsByLocation = getRoomsByLocation
	protected tableHeadings(): string[] { return ['name', 'roomId', 'locationId'] }

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(RoomsCommand)
		await super.setup(args, argv, flags)

		const roomsPromise = this.getRoomsByLocation(flags.locationId)
		this.processNormally(
			args.idOrIndex,
			() => roomsPromise,
			async (id) => {
				const room = (await roomsPromise).find(room => room.roomId === id)
				if (!room) {
					throw Error(`could not find room with id ${id}`)
				}
				return this.client.rooms.get(id, room.locationId)
			})
	}
}
