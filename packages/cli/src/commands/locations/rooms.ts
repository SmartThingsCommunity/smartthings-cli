import { Flags } from '@oclif/core'

import { Room } from '@smartthings/core-sdk'

import { APICommand, OutputItemOrListConfig, outputItemOrList, withLocation, WithNamedLocation } from '@smartthings/cli-lib'

import { getRoomsByLocation, tableFieldDefinitions, tableFieldDefinitionsWithLocationName } from '../../lib/commands/locations/rooms-util'


export default class RoomsCommand extends APICommand<typeof RoomsCommand.flags> {
	static description = 'list rooms or get information for a specific room'

	static flags = {
		...APICommand.flags,
		location: Flags.string({
			char: 'l',
			description: 'a specific location to query',
			helpValue: '<UUID>',
		}),
		verbose: Flags.boolean({
			description: 'include location name in output',
			char: 'v',
		}),
		...outputItemOrList.flags,
	}

	static args = [{
		name: 'idOrIndex',
		description: 'room UUID or index',
	}]

	static aliases = ['rooms']

	async run(): Promise<void> {
		const config: OutputItemOrListConfig<Room & WithNamedLocation> = {
			primaryKeyName: 'roomId',
			sortKeyName: 'name',
			listTableFieldDefinitions: tableFieldDefinitions,
			tableFieldDefinitions: tableFieldDefinitions,
		}
		if (this.flags.verbose) {
			config.listTableFieldDefinitions = tableFieldDefinitionsWithLocationName
			config.tableFieldDefinitions = tableFieldDefinitionsWithLocationName
		}
		const rooms = await getRoomsByLocation(this.client, this.flags.location)
		await outputItemOrList(this, config, this.args.idOrIndex,
			async () => rooms,
			async id => {
				const room = rooms.find(room => room.roomId === id)
				if (!room) {
					throw Error(`could not find room with id ${id}`)
				}
				const chosenRoom = await this.client.rooms.get(id, room.locationId)
				if (this.flags.verbose) {
					return await withLocation(this.client, chosenRoom)
				}
				return chosenRoom
			})
	}
}
