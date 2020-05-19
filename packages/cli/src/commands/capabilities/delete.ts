import { SimpleAPICommand } from '@smartthings/cli-lib'
import { capabilityIdInputArgs } from '../capabilities'


export default class CapabilitiesDelete extends SimpleAPICommand {
	static description = 'delete a capability'

	static flags = SimpleAPICommand.flags

	static args = capabilityIdInputArgs

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilitiesDelete)
		await super.setup(args, argv, flags)

		this.processNormally(`capability ${args.id}, version ${args.version} deleted`,
			async () => { this.client.capabilities.delete(args.id, args.version)})
	}
}
