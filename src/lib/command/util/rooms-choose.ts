import { type Room } from '@smartthings/core-sdk'

import { type WithNamedLocation } from '../../api-helpers.js'
import { fatalError } from '../../util.js'
import { type APICommand } from '../api-command.js'
import { selectFromList, type SelectFromListConfig } from '../select.js'
import { tableFieldDefinitionsWithLocationName } from './rooms-table.js'
import { getRoomsWithLocation } from './rooms-util.js'


export const chooseRoom = async (
		command: APICommand,
		preselectedId?: string,
		options?: {
			locationId?: string
			autoChoose?: boolean
		},
): Promise<[string, string]> => {
	const rooms = await getRoomsWithLocation(command.client, options?.locationId)
	const config: SelectFromListConfig<Room & WithNamedLocation> = {
		itemName: 'room',
		primaryKeyName: 'roomId',
		sortKeyName: 'name',
		listTableFieldDefinitions: tableFieldDefinitionsWithLocationName,
	}
	const roomId = await selectFromList(
		command,
		config,
		{
			preselectedId,
			autoChoose: options?.autoChoose,
			listItems: async () => rooms,
		},
	)
	const room = rooms.find(room => room.roomId === roomId)
	if (!room) {
		return fatalError(`could not find room with id ${roomId}`)
	}
	if (!room.locationId) {
		return fatalError(`could not determine location id for room ${roomId}`)
	}
	return [roomId, room.locationId]
}
