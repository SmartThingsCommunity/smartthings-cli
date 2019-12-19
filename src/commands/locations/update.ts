import { flags } from '@oclif/command'

import { LocationUpdate } from '@smartthings/smartthings-core-js/dist/core-public/locations'

import APICommand from '../../api-command'


export default class LocationsUpdate extends APICommand {
	static description = 'update a location'

	static flags = {
		...APICommand.flags,
		data: flags.string({
			char: 'd',
			description: 'JSON data for location',
		}),
	}

	static args = [{
		name: 'id',
		description: 'the location id',
		required: true
	}]

	private updateAndDisplay(locationId: string, location: LocationUpdate): void {
		try {
			const updatedLocation = this.client.locations.update(locationId, location)
			this.log(JSON.stringify(updatedLocation, null, 4))
		} catch (err) {
			this.log(`caught error ${err} attempting to create location`)
		}
	}

	async run(): Promise<void> {
		const { args, flags } = this.parse(LocationsUpdate)
		super.setup(args, flags)

		if (flags.data) {
			const location: LocationUpdate = JSON.parse(flags.data)
			this.updateAndDisplay(args.id, location)
		} else {
			const stdin = process.stdin
			const inputChunks: string[] = []
			stdin.resume()
			stdin.on('data', chunk => {
				inputChunks.push(chunk)
			})
			stdin.on('end', () => {
				const location = JSON.parse(inputChunks.join())
				this.updateAndDisplay(args.id, location)
			})
		}
	}
}
