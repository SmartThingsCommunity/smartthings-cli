import { APICommand } from '@smartthings/cli-lib'


export default class Locations extends APICommand {
	static description = 'get a specific Location'

	static flags = APICommand.flags

	static args = [{
		name: 'id',
		description: 'the location id',
		required: true,
	}]

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(Locations)
		await super.setup(args, argv, flags)

		this.client.locations.get(args.id).then(async location => {
			this.log(JSON.stringify(location, null, 4))
		}).catch(err => {
			this.log(`caught error ${err}`)
		})
	}
}
