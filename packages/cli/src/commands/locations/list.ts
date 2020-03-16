import { APICommand } from '@smartthings/cli-lib'


export default class LocationsList extends APICommand {
	static description = 'list all Locations currently available in a user account'

	static flags = {
		...APICommand.flags,
		...APICommand.outputFlags,
	}

	async run(): Promise<void> {
		const { argv, flags } = this.parse(LocationsList)
		await super.setup(argv, flags)

		this.client.locations.list().then(async locations => {
			this.log(JSON.stringify(locations, null, 4))
		}).catch(err => {
			this.log(`caught error ${err}`)
		})
	}
}
