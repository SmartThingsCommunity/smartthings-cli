import { flags } from '@oclif/command'
import { Room } from '@smartthings/core-sdk'

import { getRoomsByLocation } from '../rooms'
import { SelectingAPICommand } from '@smartthings/cli-lib'


export default class RoomsDeleteCommand extends SelectingAPICommand<Room> {
	static description = 'delete a room'

	static flags = {
		...SelectingAPICommand.flags,
		locationId: flags.string({
			char: 'l',
			description: 'a specific location to query',
		}),
	}

	static args = [{
		name: 'idOrIndex',
		description: 'room UUID or number in the list',
	}]

	static aliases = ['rooms:delete']

	primaryKeyName = 'roomId'
	sortKeyName = 'name'

	protected getRoomsByLocation = getRoomsByLocation
	protected tableHeadings(): string[] { return ['name', 'roomId', 'locationId'] }

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(RoomsDeleteCommand)
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
				this.client.rooms.delete(id, room.locationId)
			},
			'room {{id}} deleted')
	}
}
