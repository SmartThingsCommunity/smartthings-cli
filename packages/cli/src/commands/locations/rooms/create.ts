import { flags } from '@oclif/command'
import { Room, RoomRequest } from '@smartthings/core-sdk'

import { tableFieldDefinitions } from '../rooms'
import { InputOutputAPICommand } from '@smartthings/cli-lib'


export default class RoomsCreate extends InputOutputAPICommand<RoomRequest, Room> {
	static description = 'create a room'

	static flags = {
		...InputOutputAPICommand.flags,
		locationid: flags.string({
			char: 'l',
			description: 'a specific location to query',
		}),
	}

	static aliases = ['rooms:create']

	protected tableFieldDefinitions = tableFieldDefinitions

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(RoomsCreate)
		await super.setup(args, argv, flags)

		this.processNormally(location => {
			return this.client.rooms.create(location, flags.locationid)
		})
	}
}
