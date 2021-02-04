import { flags } from '@oclif/command'
import { CLIError } from '@oclif/errors'

import { APICommand, selectFromList } from '@smartthings/cli-lib'

import { getRoomsByLocation } from '../rooms'


export default class RoomsDeleteCommand extends APICommand {
	static description = 'delete a room'

	static flags = {
		...APICommand.flags,
		'location-id': flags.string({
			char: 'l',
			description: 'a specific location to query',
		}),
	}

	static args = [{
		name: 'id',
		description: 'room UUID',
	}]

	static aliases = ['rooms:delete']

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(RoomsDeleteCommand)
		await super.setup(args, argv, flags)

		const config = {
			primaryKeyName: 'roomId',
			sortKeyName: 'name',
			listTableFieldDefinitions: ['name', 'roomId', 'locationId'],
		}
		const rooms = await getRoomsByLocation(this.client, flags['location-id'])
		const roomId = await selectFromList(this, config, args.id, async () => rooms, 'Select a room to delete.')
		const room = rooms.find(room => room.roomId === roomId)
		if (!room) {
			throw new CLIError(`could not find room with id ${roomId}`)
		}
		await this.client.rooms.delete(roomId, room.locationId)
		this.log(`room ${roomId} deleted`)
	}
}
