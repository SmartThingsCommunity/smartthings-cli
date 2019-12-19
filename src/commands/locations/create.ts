import { flags } from '@oclif/command'

import { LocationCreate } from '@smartthings/smartthings-core-js/dist/core-public/locations'

import APICommand from '../../api-command'


export default class LocationsCreate extends APICommand {
	static description = 'create a Location for a user'

	static flags = {
		...APICommand.flags,
		data: flags.string({
			char: 'd',
			description: 'JSON data for location',
		}),
	}

	private createAndDisplay(location: LocationCreate): void {
		try {
			const createdLocation = this.client.locations.create(location)
			this.log(JSON.stringify(createdLocation, null, 4))
		} catch (err) {
			this.log(`caught error ${err} attempting to create location`)
		}
	}

	async run(): Promise<void> {
		const { args, flags } = this.parse(LocationsCreate)
		super.setup(args, flags)

		if (flags.data) {
			const location: LocationCreate = JSON.parse(flags.data)
			this.createAndDisplay(location)
		} else {
			const stdin = process.stdin
			const inputChunks: string[] = []
			stdin.resume()
			stdin.on('data', chunk => {
				inputChunks.push(chunk)
			})
			stdin.on('end', () => {
				const location = JSON.parse(inputChunks.join())
				this.createAndDisplay(location)
			})
		}
	}
}
