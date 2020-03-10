import { APICommand } from '@smartthings/cli-lib'


export default class Capabilities extends APICommand {
	static description = "get a specific capability from a user's account"

	static flags = APICommand.flags

	static args = [
		{
			name: 'id',
			description: 'the capability id',
			required: true,
		},
		{
			name: 'version',
			description: 'the capability version',
			required: true,
		},
	]

	async run(): Promise<void> {
		const { args, flags } = this.parse(Capabilities)
		await super.setup(args, flags)
		this.client.capabilities.get(args.id, args.version).then(async capability => {
			this.log(JSON.stringify(capability, null, 4))
		}).catch(err => {
			console.log(err.response.data.error)
			this.log(`caught error ${err}`)
		})
	}
}
