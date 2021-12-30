import { Errors } from '@oclif/core'
import { APICommand, selectFromList } from '@smartthings/cli-lib'
import { LocationItem, Room, SmartThingsClient } from '@smartthings/core-sdk'
import * as roomsUtil from './rooms-util'


export const tableFieldDefinitions = ['name', 'locationId', 'roomId']

export async function getRoomsByLocation(client: SmartThingsClient, locationId?: string): Promise<RoomWithLocation[]> {
	let locations: LocationItem[] = []
	if (locationId) {
		locations = [await client.locations.get(locationId)]
	} else {
		locations = await client.locations.list()
	}

	if (!locations || locations.length == 0) {
		throw new Errors.CLIError('could not find any locations for your account. Perhaps ' +
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

export async function chooseRoom(command: APICommand, locationId?: string, roomArg?: string): Promise<[string, string]> {
	const rooms = await roomsUtil.getRoomsByLocation(command.client, locationId)
	const config = {
		itemName: 'room',
		primaryKeyName: 'roomId',
		sortKeyName: 'name',
		listTableFieldDefinitions: tableFieldDefinitions,
	}
	const roomId = await selectFromList(command, config, roomArg, async () => rooms)
	const room = rooms.find(room => room.roomId === roomId)
	if (!room) {
		throw new Errors.CLIError(`could not find room with id ${roomId}`)
	}
	if (!room.locationId) {
		throw new Errors.CLIError(`could not determine location id for room ${roomId}`)
	}
	return [roomId, room.locationId]
}
