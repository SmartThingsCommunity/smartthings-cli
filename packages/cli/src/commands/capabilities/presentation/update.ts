import { CapabilityPresentation, CapabilityPresentationUpdate } from '@smartthings/core-sdk'

import { APIOrganizationCommand, inputAndOutputItem } from '@smartthings/cli-lib'

import { buildTableOutput } from '../presentation'
import { capabilityIdInputArgs, chooseCapability } from '../../../lib/commands/capabilities-util'


export default class CapabilitiesPresentationUpdate extends APIOrganizationCommand<typeof CapabilitiesPresentationUpdate.flags> {
	static description = 'update presentation information of a capability'

	static flags = {
		...APIOrganizationCommand.flags,
		...inputAndOutputItem.flags,
	}

	static args = capabilityIdInputArgs

	async run(): Promise<void> {
		const id = await chooseCapability(this, this.args.id, this.args.version)
		await inputAndOutputItem<CapabilityPresentationUpdate, CapabilityPresentation>(this,
			{ buildTableOutput: data => buildTableOutput(this.tableGenerator, data) },
			(_, capabilityPresentation) => this.client.capabilities.updatePresentation(id.id, id.version, capabilityPresentation))
	}
}
