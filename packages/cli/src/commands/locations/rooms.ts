import { flags } from '@oclif/command'
import { CLIError } from '@oclif/errors'

import { LocationItem, Room, SmartThingsClient } from '@smartthings/core-sdk'

import { APICommand, outputListing, selectFromList } from '@smartthings/cli-lib'


export const tableFieldDefinitions = ['name', 'locationId', 'roomId']

export async function getRoomsByLocation(client: SmartThingsClient, locationId?: string): Promise<RoomWithLocation[]> {
	let locations: LocationItem[] = []
	if (locationId) {
		locations = [await client.locations.get(locationId)]
	} else {
		locations = await client.locations.list()
	}

	if (!locations || locations.length == 0) {
		throw new CLIError('could not find any locations for your account. Perhaps ' +
			"you haven't created any locations yet.")
	}

	let rooms: RoomWithLocation[] = []
	for (const location of locations) {
		const locationRooms = await client.rooms.list(location.locationId)
		rooms = rooms.concat(locationRooms.map(room => { return { ...room, locationName: location.name } }))
	}
	return rooms
}

export type RoomWithLocation = Room & {
	locationName?: string
}

export async function chooseRoom(command: APICommand, locationId?: string, deviceFromArg?: string): Promise<[string, string]> {
	const rooms = await getRoomsByLocation(command.client, locationId)
	const config = {
		itemName: 'room',
		primaryKeyName: 'roomId',
		sortKeyName: 'name',
		listTableFieldDefinitions: tableFieldDefinitions,
	}
	const roomId = await selectFromList(command, config, deviceFromArg, async () => rooms)
	const room = rooms.find(room => room.roomId === roomId)
	if (!room) {
		throw new CLIError(`could not find room with id ${roomId}`)
	}
	if (!room.locationId) {
		throw new CLIError(`could not determine location id for room ${roomId}`)
	}
	return [roomId, room.locationId]
}

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

		const config = {
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
