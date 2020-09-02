import _ from 'lodash'
import { SmartThingsClient } from '@smartthings/core-sdk'


export interface WithLocation {
	locationId?: string
}

export interface WithNamedLocation extends WithLocation {
	location?: string
}

export interface WithRoom extends WithLocation {
	roomId?: string
}

export interface WithNamedRoom extends WithNamedLocation, WithRoom {
	room?: string
}

async function buildLocationNamesById(client: SmartThingsClient): Promise<Map<string, string>> {
	const locations = await client.locations.list()
	return new Map(locations.map(location => [location.locationId, location.name]))
}

function withLocation<T extends WithLocation>(item: T, locationNameById: Map<string, string>): T & WithNamedLocation {
	return { ...item, location: item.locationId ? locationNameById.get(item.locationId) ?? '<invalid locationId>' : '' }
}

export async function withLocations<T>(client: SmartThingsClient,
		list: (T & WithLocation)[]): Promise<(T & WithNamedLocation)[]> {
	const locationNameById = await buildLocationNamesById(client)

	return list.map(item => withLocation(item, locationNameById))
}

function notEmpty<T>(value: T | null | undefined): value is T {
	return value !== null && value !== undefined
}

function uniqueLocationIds(from: WithLocation[]): string[] {
	// Note -- the `.filter(notEmpty))` is here because the source types such
	// as InstalledApp are currently defined with optional locationId even
	// though locationId is actually always set. The filter can be removed
	// once that issue is corrected.
	return _.uniq(from.map(it => it.locationId).filter(notEmpty))
}

export async function withLocationsAndRooms<T extends WithRoom>(client: SmartThingsClient,
		list: T[]): Promise<(T & WithNamedRoom)[]> {
	const locationNameById = await buildLocationNamesById(client)
	const locationIds = uniqueLocationIds(list)
	const roomNamesById = new Map((await Promise.all(locationIds.map((locationId) => {
		return client.rooms.list(locationId)
	}))).flat().map(room => [room.roomId ?? '', room.name ?? ''] as [string, string]))

	return list.map(item => {
		let location = ''
		let room = ''
		if (item.locationId) {
			location = locationNameById.get(item.locationId) ?? ''

			if (item.roomId) {
				room = roomNamesById.get(item.roomId) ?? ''
			}
		}
		return { ...item, location, room }
	})
}
