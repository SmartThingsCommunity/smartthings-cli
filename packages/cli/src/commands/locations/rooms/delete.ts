import { Flags } from '@oclif/core'
import { APICommand } from '@smartthings/cli-lib'
import { chooseRoom } from '../../../lib/commands/locations/rooms/rooms-util'


export default class RoomsDeleteCommand extends APICommand {
	static description = 'delete a room'

	static flags = {
		...APICommand.flags,
		'location-id': Flags.string({
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
		const { args, argv, flags } = await this.parse(RoomsDeleteCommand)
		await super.setup(args, argv, flags)

		const [roomId, locationId] = await chooseRoom(this, flags['location-id'], args.id)
		await this.client.rooms.delete(roomId, locationId)
		this.log(`room ${roomId} deleted`)
	}
}
