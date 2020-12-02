import { flags } from '@oclif/command'
import { Room, RoomRequest } from '@smartthings/core-sdk'

import { getRoomsByLocation, tableFieldDefinitions } from '../rooms'
import { SelectingInputOutputAPICommand } from '@smartthings/cli-lib'


export default class RoomsUpdateCommand extends SelectingInputOutputAPICommand <RoomRequest, Room, Room> {
	static description = 'update a room'

	static flags = {
		...SelectingInputOutputAPICommand.flags,
		locationId: flags.string({
			char: 'l',
			description: 'a specific locationId to query',
		}),
	}

	static args = [{
		name: 'id',
		description: 'room UUID',
	}]

	static aliases = ['rooms:update']

	primaryKeyName = 'roomId'
	sortKeyName = 'name'

	protected tableFieldDefinitions = tableFieldDefinitions
	protected listTableFieldDefinitions = tableFieldDefinitions

	protected getRoomsByLocation = getRoomsByLocation

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(RoomsUpdateCommand)
		await super.setup(args, argv, flags)

		const roomsPromise = this.getRoomsByLocation(flags.locationId)
		await this.processNormally(
			args.id,
			() => roomsPromise,
			async (id, data) => {
				const room = (await roomsPromise).find(room => room.roomId === id)
				if (!room) {
					throw Error(`could not find room with id ${id}`)
				}
				return this.client.rooms.update(id, data, room.locationId)
			})
	}
}
