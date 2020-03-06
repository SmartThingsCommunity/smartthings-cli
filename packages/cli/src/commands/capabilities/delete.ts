import { APICommand } from '@smartthings/cli-lib'


export default class CapabilitiesDelete extends APICommand {
	static description = 'delete a Capability from a user\'s account'

	static flags = APICommand.flags

	static args = [
		{
			name: 'id',
			description: 'the capability id',
			required: true
		},
		{
			name: 'version',
			description: 'the capability version',
			required: true
		}
	]

	async run(): Promise<void> {
		const { args, flags } = this.parse(CapabilitiesDelete)
		await super.setup(args, flags)

		this.client.capabilities.delete(args.id, args.version).then(async () => {
			this.log(`capability ${args.id}, version ${args.version} deleted`)
		}).catch(err => {
			this.log(`caught error ${err}`)
		})
	}
}
