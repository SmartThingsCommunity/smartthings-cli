import { Capability, CapabilityUpdate } from '@smartthings/core-sdk'

import { APIOrganizationCommand, inputAndOutputItem } from '@smartthings/cli-lib'

import { buildTableOutput, capabilityIdInputArgs, chooseCapability } from '../capabilities'


export default class CapabilitiesUpdate extends APIOrganizationCommand {
	static description = 'update a capability'

	static flags = {
		...APIOrganizationCommand.flags,
		...inputAndOutputItem.flags,
	}

	static args = capabilityIdInputArgs

	async run(): Promise<void> {
		const { args, argv, flags } = this.parse(CapabilitiesUpdate)
		await super.setup(args, argv, flags)

		const id = await chooseCapability(this, args.id, args.version)
		await inputAndOutputItem<CapabilityUpdate, Capability>(this,
			{ buildTableOutput: data => buildTableOutput(this.tableGenerator, data) },
			(_, capability) => this.client.capabilities.update(id.id, id.version, capability))
	}
}
