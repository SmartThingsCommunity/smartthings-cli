import { APICommand } from '@smartthings/cli-lib'
import { capabilityIdInputArgs } from '../capabilities'


export default class CapabilitiesDelete extends APICommand {
	static description = 'delete a capability'

	static flags = APICommand.flags

	static args = capabilityIdInputArgs

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilitiesDelete)
		await super.setup(args, argv, flags)

		this.client.capabilities.delete(args.id, args.version).then(async () => {
			this.log(`capability ${args.id}, version ${args.version} deleted`)
		}).catch(err => {
			this.log(`caught error ${err}`)
		})
	}
}
