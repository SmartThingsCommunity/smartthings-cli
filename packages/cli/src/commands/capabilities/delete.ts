import { APIOrganizationCommand } from '@smartthings/cli-lib'

import { capabilityIdInputArgs, chooseCapability } from '../../lib/commands/capabilities-util'


export default class CapabilitiesDeleteCommand extends APIOrganizationCommand<typeof CapabilitiesDeleteCommand.flags> {
	static description = 'delete a capability' +
		this.apiDocsURL('deleteCapability')

	static flags = APIOrganizationCommand.flags

	static args = capabilityIdInputArgs

	async run(): Promise<void> {
		const id = await chooseCapability(this, this.args.id, this.args.version)
		await this.client.capabilities.delete(id.id, id.version)
		this.log(`capability ${id.id} (version ${id.version}) deleted`)
	}
}
