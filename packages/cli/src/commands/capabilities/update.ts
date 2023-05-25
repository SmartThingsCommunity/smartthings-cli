import { Capability, CapabilityUpdate } from '@smartthings/core-sdk'

import { APIOrganizationCommand, inputAndOutputItem } from '@smartthings/cli-lib'

import { buildTableOutput, capabilityIdInputArgs, chooseCapability } from '../../lib/commands/capabilities-util.js'


export default class CapabilitiesUpdate extends APIOrganizationCommand<typeof CapabilitiesUpdate.flags> {
	static description = 'update a capability' +
		this.apiDocsURL('updateCapability')

	static flags = {
		...APIOrganizationCommand.flags,
		...inputAndOutputItem.flags,
	}

	static args = capabilityIdInputArgs

	async run(): Promise<void> {
		const id = await chooseCapability(this, this.args.id, this.args.version)
		await inputAndOutputItem<CapabilityUpdate, Capability>(this,
			{ buildTableOutput: data => buildTableOutput(this.tableGenerator, data) },
			(_, capability) => this.client.capabilities.update(id.id, id.version, capability))
	}
}
