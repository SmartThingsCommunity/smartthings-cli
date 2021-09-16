import { APIOrganizationCommand } from '@smartthings/cli-lib'

import { capabilityIdInputArgs, chooseCapability } from '../capabilities'


export default class CapabilitiesDeleteCommand extends APIOrganizationCommand {
	static description = 'delete a capability'

	static flags = APIOrganizationCommand.flags

	static args = capabilityIdInputArgs

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilitiesDeleteCommand)
		await super.setup(args, argv, flags)

		const id = await chooseCapability(this, args.id, args.version)
		await this.client.capabilities.delete(id.id, id.version)
		this.log(`capability ${id.id} (version ${id.version}) deleted`)
	}
}
