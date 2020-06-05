import _ from 'lodash'
import { SmartThingsClient } from '@smartthings/core-sdk'


export interface LocationItem {
	locationId?: string
	location?: string
}

export interface LocationRoomItem extends LocationItem {
	roomId?: string
	room?: string
}

export interface RoomItem {
	locationId?: string
	roomId?: string
	room?: string
}

class IdNameMap {
	[name: string]: string
}

class NestedIdNameMap {
	[name: string]: {[name: string]: string}
}

export async function addLocations(client: SmartThingsClient, list: LocationItem[]): Promise<void> {
	const locations = await client.locations.list()
	const names: {[name: string]: string} = locations.reduce((map, obj) => {
		map[obj.locationId] = obj.name
		return map
	}, new IdNameMap())

	for (const item of list) {
		if (item.locationId) {
			item.location = names[item.locationId]
		} else {
			item.location = ''
		}
	}
}

export async function addLocationsAndRooms(client: SmartThingsClient, list: LocationRoomItem[]): Promise<void> {
	const locations = await client.locations.list()
	const locationMap: {[name: string]: string} = locations.reduce((map, obj) => {
		map[obj.locationId] = obj.name
		return map
	}, new IdNameMap())

	// eslint-disable-next-line no-console
	console.log(`LOCATIONS = ${JSON.stringify(locationMap)}`)

	// Note -- this ignore is here because the source types such as InstalledApp are currently defined with
	// optional locationIds even though the location ID is actually always set. The ignore can be removed
	// once that issue is corrected.
	//
	// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
	// @ts-ignore
	const locationIds: string[] = _.uniq(list.map(it => it.locationId))

	const roomsList = await Promise.all(locationIds.map((it) => {
		return client.rooms.list(it)
	}))

	const locationRoomMap = await locationIds.reduce((map, locationId, index) => {
		const rooms = roomsList[index]
		map[locationId] = rooms.reduce((map2, room) => {
			if (room.roomId) {
				map2[room.roomId] = room.name || ''
			}
			return map2
		}, new IdNameMap())
		return map
	}, new NestedIdNameMap())

	// eslint-disable-next-line no-console
	console.log(`LOCATIONS & ROOMS = ${JSON.stringify(locationRoomMap)}`)

	for (const item of list) {
		if (item.locationId) {
			item.location = locationMap[item.locationId]

			if (item.roomId) {
				item.room = locationRoomMap[item.locationId][item.roomId]
			} else {
				item.room = ''
			}
		} else {
			item.location = ''
		}
	}
}

export async function addRooms(client: SmartThingsClient, list: RoomItem[]): Promise<void> {
	// Note -- this ignore is here because the source types such as InstalledApp are currently defined with
	// optional locationIds even though the location ID is actually always set. The ignore can be removed
	// once that issue is corrected.
	//
	// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
	// @ts-ignore
	const locationIds: string[] = _.uniq(list.map(it => it.locationId))
	const roomsList = await Promise.all(locationIds.map((it) => {
		return client.rooms.list(it)
	}))

	const locationRoomMap = await locationIds.reduce((map, locationId, index) => {
		const rooms = roomsList[index]
		map[locationId] = rooms.reduce((map2, room) => {
			if (room.roomId) {
				map2[room.roomId] = room.name || ''
			}
			return map2
		},  new IdNameMap())
		return map
	}, new NestedIdNameMap())

	for (const item of list) {
		if (item.locationId && item.roomId) {
			item.room = locationRoomMap[item.locationId][item.roomId] || ''
		} else {
			item.room = ''
		}
	}
}
