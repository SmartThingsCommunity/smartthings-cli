import APICommand from '../../api-command'


export default class LocationsList extends APICommand {
	static description = 'list all Locations currently available in a user account'

	static flags = {
		...APICommand.flags,
		...APICommand.jsonOutputFlags,
	}

	async run(): Promise<void> {
		const { args, flags } = this.parse(LocationsList)
		super.setup(args, flags)

		this.client.locations.list().then(async locations => {
			this.log(JSON.stringify(locations, null, 4))
		}).catch(err => {
			this.log(`caught error ${err}`)
		})
	}
}
