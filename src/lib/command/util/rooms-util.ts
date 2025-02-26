import { type Room, type SmartThingsClient } from '@smartthings/core-sdk'

import { type WithNamedLocation } from '../../api-helpers.js'
import { fatalError } from '../../util.js'


export const getRoomsWithLocation = async (
		client: SmartThingsClient,
		locationId?: string,
): Promise<(Room & WithNamedLocation)[]> => {
	const locations = locationId
		? [await client.locations.get(locationId)]
		: await client.locations.list()

	if (!locations || locations.length == 0) {
		return fatalError('could not find any locations for your account. Perhaps' +
			" you haven't created any locations yet.")
	}

	let rooms: (Room & WithNamedLocation)[] = []
	for (const location of locations) {
		const locationRooms = await client.rooms.list(location.locationId)
		rooms = rooms.concat(locationRooms.map(room => { return { ...room, location: location.name } }))
	}
	return rooms
}
