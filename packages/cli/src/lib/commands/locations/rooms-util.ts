import { Errors } from '@oclif/core'

import { LocationItem, Room, SmartThingsClient } from '@smartthings/core-sdk'

import * as roomsUtil from './rooms-util'
import { APICommand, selectFromList, SelectFromListConfig, WithNamedLocation } from '@smartthings/cli-lib'


export const tableFieldDefinitions = ['name', 'roomId', 'locationId' ]
export const tableFieldDefinitionsWithLocationName = ['name', 'roomId', 'location', 'locationId' ]

export async function getRoomsByLocation(client: SmartThingsClient, locationId?: string): Promise<(Room & WithNamedLocation)[]> {
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

	let rooms: (Room & WithNamedLocation)[] = []
	for (const location of locations) {
		const locationRooms = await client.rooms.list(location.locationId)
		rooms = rooms.concat(locationRooms.map(room => { return { ...room, location: location.name } }))
	}
	return rooms
}

export async function chooseRoom(command: APICommand<typeof APICommand.flags>, locationId?: string, preselectedId?: string, autoChoose?: boolean): Promise<[string, string]> {
	const rooms = await roomsUtil.getRoomsByLocation(command.client, locationId)
	const config: SelectFromListConfig<Room> = {
		itemName: 'room',
		primaryKeyName: 'roomId',
		sortKeyName: 'name',
		listTableFieldDefinitions: tableFieldDefinitionsWithLocationName,
	}
	const roomId = await selectFromList(command, config, {
		preselectedId,
		autoChoose,
		listItems: async () => rooms,
	})
	const room = rooms.find(room => room.roomId === roomId)
	if (!room) {
		throw new Errors.CLIError(`could not find room with id ${roomId}`)
	}
	if (!room.locationId) {
		throw new Errors.CLIError(`could not determine location id for room ${roomId}`)
	}
	return [roomId, room.locationId]
}
