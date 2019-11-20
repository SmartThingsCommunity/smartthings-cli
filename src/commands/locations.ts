import APICommand from '../api-command'


export default class Locations extends APICommand {
	static description = 'get a specific Location from a user\'s account'

	static flags = APICommand.flags

	static args = [{
		name: 'id',
		description: 'the location id',
		required: true,
	}]

	async run(): Promise<void> {
		const { args, flags } = this.parse(Locations)
		super.setup(args, flags)

		this.client.locations.find(args.id).then(async location => {
			this.log(JSON.stringify(location, null, 4))
		}).catch(err => {
			this.log(`caught error ${err}`)
		})
	}
}
