import { CapabilityPresentation, CapabilityPresentationCreate } from '@smartthings/core-sdk'

import { APIOrganizationCommand, inputAndOutputItem } from '@smartthings/cli-lib'

import { buildTableOutput } from '../presentation'
import { capabilityIdInputArgs, chooseCapability } from '../../capabilities'


export default class CapabilitiesPresentationCreate extends APIOrganizationCommand<typeof CapabilitiesPresentationCreate.flags> {
	static description = 'create presentation model for a capability'

	static flags = {
		...APIOrganizationCommand.flags,
		...inputAndOutputItem.flags,
	}

	static args = capabilityIdInputArgs

	async run(): Promise<void> {
		const id = await chooseCapability(this, this.args.id, this.args.version)
		await inputAndOutputItem<CapabilityPresentationCreate, CapabilityPresentation>(this,
			{ buildTableOutput: data => buildTableOutput(this.tableGenerator, data) },
			(_, presentation) => this.client.capabilities.createPresentation(id.id, id.version, presentation))
	}
}
